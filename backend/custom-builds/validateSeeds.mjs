import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ============================================================
// VALIDATION ENGINE
// ============================================================

console.log('🔍 PC BUILDER SEEDS VALIDATION\n');
console.log('=' .repeat(60));

// Load seed files
let components, presets, presetItems, specOverrides;

try {
  components = JSON.parse(fs.readFileSync('./pc_components.seed.json', 'utf8')).data;
  presets = JSON.parse(fs.readFileSync('./pc_presets.seed.json', 'utf8')).data;
  presetItems = JSON.parse(fs.readFileSync('./pc_preset_items.seed.json', 'utf8')).data;
  specOverrides = JSON.parse(fs.readFileSync('./pc_spec_overrides.seed.json', 'utf8')).data;
} catch (err) {
  console.error('❌ Error loading seed files:', err.message);
  process.exit(1);
}

// ============================================================
// 1. DUPLICATE DETECTION
// ============================================================

console.log('\n📋 1. CHECKING FOR DUPLICATE COMPONENTS\n');

const componentsByKey = {};
const duplicates = [];

components.forEach(comp => {
  const key = `${comp.name.toLowerCase()}::${comp.type.toLowerCase()}`;
  if (componentsByKey[key]) {
    duplicates.push({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      duplicate_of: componentsByKey[key].id
    });
  } else {
    componentsByKey[key] = comp;
  }
});

if (duplicates.length === 0) {
  console.log('✅ No duplicate components found');
} else {
  console.log(`⚠️ Found ${duplicates.length} duplicate components:`);
  duplicates.slice(0, 10).forEach(dup => {
    console.log(`   - ${dup.id} (${dup.name})`);
  });
  if (duplicates.length > 10) {
    console.log(`   ... and ${duplicates.length - 10} more`);
  }
}

// ============================================================
// 2. MISSING SPECS DETECTION
// ============================================================

console.log('\n📋 2. CHECKING FOR MISSING COMPATIBILITY SPECS\n');

const missingSpecs = [];
const specsByComponent = {};

components.forEach(comp => {
  const requiredFields = {
    cpu: ['cpu_socket', 'estimated_wattage'],
    motherboard: ['motherboard_socket', 'estimated_wattage'],
    gpu: ['gpu_length_mm', 'estimated_wattage', 'vram_gb'],
    ram: ['ram_type', 'ram_capacity_gb', 'estimated_wattage'],
    storage: ['storage_capacity_gb', 'storage_type', 'estimated_wattage'],
    psu: ['psu_wattage', 'estimated_wattage'],
    case: ['case_max_gpu_length_mm', 'estimated_wattage'],
    cooler: ['estimated_wattage']
  };

  const required = requiredFields[comp.type] || [];
  const missing = required.filter(field => {
    const value = comp[field];
    return value === null || value === undefined || value === '';
  });

  specsByComponent[comp.id] = { ...comp };

  if (missing.length > 0) {
    missingSpecs.push({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      missing: missing
    });
  }
});

if (missingSpecs.length === 0) {
  console.log('✅ All components have required specs');
} else {
  console.log(`❌ ${missingSpecs.length} components missing specs:`);
  missingSpecs.slice(0, 5).forEach(item => {
    console.log(`   - ${item.id}: missing ${item.missing.join(', ')}`);
  });
  if (missingSpecs.length > 5) {
    console.log(`   ... and ${missingSpecs.length - 5} more`);
  }
}

// ============================================================
// 3. VALIDATE EACH PRESET
// ============================================================

console.log('\n📋 3. VALIDATING PRESET BUILDS\n');

const validBuilds = [];
const warningBuilds = [];
const invalidBuilds = [];

presets.forEach(preset => {
  const presetItemsList = presetItems.filter(item => item.preset_id === preset.id);
  const itemsByType = {};

  presetItemsList.forEach(item => {
    itemsByType[item.component_type] = item;
  });

  const errors = [];
  const warnings = [];

  // Check required components
  const requiredTypes = ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case'];
  requiredTypes.forEach(type => {
    if (!itemsByType[type]) {
      errors.push(`Missing required component: ${type}`);
    }
  });

  // Validate compatibility rules
  if (itemsByType.cpu && itemsByType.motherboard) {
    const cpuSpec = specsByComponent[itemsByType.cpu.component_id];
    const mbSpec = specsByComponent[itemsByType.motherboard.component_id];

    if (cpuSpec?.cpu_socket && mbSpec?.motherboard_socket) {
      if (cpuSpec.cpu_socket !== mbSpec.motherboard_socket) {
        errors.push(`CPU socket ${cpuSpec.cpu_socket} ≠ Motherboard socket ${mbSpec.motherboard_socket}`);
      }
    }
  }

  if (itemsByType.gpu && itemsByType.case) {
    const gpuSpec = specsByComponent[itemsByType.gpu.component_id];
    const caseSpec = specsByComponent[itemsByType.case.component_id];

    if (gpuSpec?.gpu_length_mm && caseSpec?.case_max_gpu_length_mm) {
      if (gpuSpec.gpu_length_mm > caseSpec.case_max_gpu_length_mm) {
        errors.push(
          `GPU too long: ${gpuSpec.gpu_length_mm}mm > Case limit ${caseSpec.case_max_gpu_length_mm}mm`
        );
      }
    }
  }

  if (itemsByType.ram && itemsByType.motherboard) {
    const ramSpec = specsByComponent[itemsByType.ram.component_id];
    const mbSpec = specsByComponent[itemsByType.motherboard.component_id];

    if (ramSpec?.ram_type && mbSpec?.motherboard_socket) {
      // Note: RAM type validation requires motherboard_ram_type spec (if available)
    }
  }

  if (itemsByType.psu) {
    const psuSpec = specsByComponent[itemsByType.psu.component_id];
    let totalWattage = 0;

    presetItemsList.forEach(item => {
      const spec = specsByComponent[item.component_id];
      if (spec?.estimated_wattage) {
        totalWattage += spec.estimated_wattage;
      }
    });

    const requiredWattage = Math.ceil(totalWattage * 1.2);

    if (psuSpec?.psu_wattage) {
      if (psuSpec.psu_wattage < requiredWattage) {
        errors.push(
          `PSU insufficient: ${psuSpec.psu_wattage}W < Required ${requiredWattage}W`
        );
      }
    }
  }

  // Determine status
  if (errors.length > 0) {
    invalidBuilds.push({
      id: preset.id,
      name: preset.name,
      errors
    });
  } else if (warnings.length > 0) {
    warningBuilds.push({
      id: preset.id,
      name: preset.name,
      warnings
    });
  } else {
    validBuilds.push({
      id: preset.id,
      name: preset.name
    });
  }
});

console.log(`✅ Valid builds:   ${validBuilds.length}/${presets.length}`);
console.log(`⚠️ Warning builds: ${warningBuilds.length}/${presets.length}`);
console.log(`❌ Invalid builds: ${invalidBuilds.length}/${presets.length}`);

if (invalidBuilds.length > 0) {
  console.log(`\nInvalid build details (showing first 5):`);
  invalidBuilds.slice(0, 5).forEach(build => {
    console.log(`\n   ${build.id}: ${build.name}`);
    build.errors.forEach(err => {
      console.log(`      ✗ ${err}`);
    });
  });
  if (invalidBuilds.length > 5) {
    console.log(`   ... and ${invalidBuilds.length - 5} more invalid builds`);
  }
}

// ============================================================
// FINAL REPORT
// ============================================================

console.log('\n' + '=' .repeat(60));
console.log('\n📊 VALIDATION REPORT\n');

const report = {
  timestamp: new Date().toISOString(),
  total_components: components.length,
  total_presets: presets.length,
  valid_builds: validBuilds.length,
  warning_builds: warningBuilds.length,
  invalid_builds: invalidBuilds.length,
  missing_specs: missingSpecs,
  duplicate_components: duplicates,
  status: missingSpecs.length === 0 && duplicates.length === 0 ? 'READY' : 'BLOCKED'
};

console.log(JSON.stringify(report, null, 2));

// Write report to file
fs.writeFileSync(
  './validation-report.json',
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('\n📄 Report saved to validation-report.json');

if (report.status === 'BLOCKED') {
  console.log('\n❌ VALIDATION FAILED - Fix issues before importing\n');
  process.exit(1);
} else {
  console.log('\n✅ VALIDATION PASSED - Ready to import\n');
}
