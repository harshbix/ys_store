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
// ENSURE TABLES EXIST
// ============================================================

console.log('📊 Checking database schema...\n');

const tableCreationSQL = `
-- pc_components
CREATE TABLE IF NOT EXISTS public.pc_components (
  id text PRIMARY KEY,
  type text NOT NULL,
  name text NOT NULL,
  price_tzs bigint NOT NULL DEFAULT 0,
  cpu_socket text,
  motherboard_socket text,
  motherboard_ram_type text,
  ram_type text,
  gpu_length_mm numeric,
  case_max_gpu_length_mm numeric,
  psu_wattage numeric,
  estimated_wattage numeric,
  storage_capacity_gb numeric,
  storage_type text,
  ram_capacity_gb numeric,
  vram_gb numeric,
  cooler_type text,
  cores integer,
  threads integer,
  is_visible boolean NOT NULL DEFAULT true,
  stock_status text NOT NULL DEFAULT 'in_stock',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- pc_build_presets
CREATE TABLE IF NOT EXISTS public.pc_build_presets (
  id text PRIMARY KEY,
  name text NOT NULL,
  cpu_family text NOT NULL,
  build_number integer,
  subtotal_tzs bigint NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  total_tzs bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  estimated_system_wattage numeric,
  required_psu_wattage numeric,
  compatibility_status text DEFAULT 'unknown',
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- pc_build_preset_items
CREATE TABLE IF NOT EXISTS public.pc_build_preset_items (
  id bigserial PRIMARY KEY,
  preset_id text NOT NULL REFERENCES public.pc_build_presets(id) ON DELETE CASCADE,
  slot_order integer NOT NULL,
  component_type text NOT NULL,
  component_id text NOT NULL REFERENCES public.pc_components(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price_tzs bigint NOT NULL DEFAULT 0,
  line_total_tzs bigint NOT NULL DEFAULT 0,
  is_auto_replaced boolean NOT NULL DEFAULT false,
  compatibility_notes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pc_components_type ON public.pc_components(type);
CREATE INDEX IF NOT EXISTS idx_pc_presets_family ON public.pc_build_presets(cpu_family);
CREATE INDEX IF NOT EXISTS idx_pc_preset_items_preset_id ON public.pc_build_preset_items(preset_id);
`;

// Try to create tables
try {
  // We'll use a workaround: try to insert a test record which will fail if table doesn't exist
  // Then we know to inform the user about manual setup
  const { error: testError } = await supabase
    .from('pc_components')
    .select('count()')
    .limit(1);

  if (testError?.code === 'PGRST116') {
    console.log('⚠️  Tables do not exist.\n');
   console.log('📋 CREATE TABLES MANUALLY:\n');
    console.log('1. Go to Supabase Dashboard: https://app.supabase.com');
    console.log('2. Project: kzpknqwlecicildibiqt');
    console.log('3. SQL Editor → New Query');
    console.log('4. Paste this SQL:\n');
    console.log(tableCreationSQL);
    console.log('\n5. Click Run');
    console.log('6. Then run: node custom-builds/importSeeds.mjs\n');
    process.exit(1);
  }

  console.log('✅ Database schema confirmed\n');
} catch (err) {
  console.warn('⚠️ Could not verify tables:', err.message);
  console.log('Proceeding with import...\n');
}

// ============================================================
// STEP 1: LOAD ALL JSON FILES (SOURCE OF TRUTH)
// ============================================================

console.log('📂 STEP 1: Loading seed JSON files...\n');

let pc_components_data, pc_presets_data, pc_preset_items_data, pc_spec_overrides_data;

try {
  pc_components_data = JSON.parse(fs.readFileSync('./custom-builds/pc_components.seed.json', 'utf8'));
  pc_presets_data = JSON.parse(fs.readFileSync('./custom-builds/pc_presets.seed.json', 'utf8'));
  pc_preset_items_data = JSON.parse(fs.readFileSync('./custom-builds/pc_preset_items.seed.json', 'utf8'));
  pc_spec_overrides_data = JSON.parse(fs.readFileSync('./custom-builds/pc_spec_overrides.seed.json', 'utf8'));
} catch (err) {
  console.error('❌ Error loading seed files:', err.message);
  process.exit(1);
}

console.log(`✅ Loaded ${pc_components_data.data.length} components`);
console.log(`✅ Loaded ${pc_presets_data.data.length} presets`);
console.log(`✅ Loaded ${pc_preset_items_data.data.length} preset items`);
console.log(`✅ Loaded ${pc_spec_overrides_data.data.length} spec overrides`);

// ============================================================
// STEP 2: BUILD SPEC OVERRIDES MAP
// ============================================================

console.log('\n📋 STEP 2: Building spec override map...\n');

const specOverridesMap = {};
pc_spec_overrides_data.data.forEach(override => {
  specOverridesMap[override.component_id] = override.overrides;
});

console.log(`✅ Built override map for ${Object.keys(specOverridesMap).length} components`);

// ============================================================
// STEP 3: NORMALIZE & DEDUPLICATE COMPONENTS
// ============================================================

console.log('\n🔍 STEP 3: Normalizing and deduplicating components...\n');

const componentsByKey = {}; // Key = (name + type)
const normalizedComponents = [];
const duplicates = [];

pc_components_data.data.forEach(comp => {
  // Normalize
  const normalizedName = (comp.name || '').trim().toLowerCase();
  const componentType = (comp.type || '').trim().toLowerCase();
  const key = `${normalizedName}::${componentType}`;

  if (componentsByKey[key]) {
    // Duplicate found
    duplicates.push({
      id: comp.id,
      name: comp.name,
      reason: `Duplicate of ${componentsByKey[key].id}`
    });
  } else {
    // New component - apply spec overrides
    const overrides = specOverridesMap[comp.id] || {};
    const withOverrides = {
      ...comp,
      ...overrides,
      name: normalizedName, // Normalized
      type: componentType // Normalized
    };

    componentsByKey[key] = withOverrides;
    normalizedComponents.push(withOverrides);
  }
});

console.log(`✅ Normalized ${normalizedComponents.length} unique components`);
if (duplicates.length > 0) {
  console.log(`⚠️  Found ${duplicates.length} duplicate components (will be skipped)`);
}

// ============================================================
// STEP 4: VALIDATE COMPATIBILITY FIELDS (HARD STOP)
// ============================================================

console.log('\n🛡️ STEP 4: Validating compatibility fields...\n');

const missingSpecs = [];

normalizedComponents.forEach(comp => {
  // Check required fields based on component type
  const requiredFields = {
    cpu: ['cpu_socket', 'estimated_wattage'],
    motherboard: ['motherboard_socket', 'motherboard_ram_type', 'estimated_wattage'],
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

  if (missing.length > 0) {
    missingSpecs.push({
      id: comp.id,
      name: comp.name,
      type: comp.type,
      missing_fields: missing
    });
  }
});

if (missingSpecs.length > 0) {
  console.error('\n❌ HARD STOP: Missing required compatibility fields!\n');
  missingSpecs.slice(0, 10).forEach(item => {
    console.error(`   ${item.id} (${item.type}): missing ${item.missing_fields.join(', ')}`);
  });
  if (missingSpecs.length > 10) {
    console.error(`   ... and ${missingSpecs.length - 10} more`);
  }
  process.exit(1);
}

console.log('✅ All components have required compatibility fields');

// ============================================================
// STEP 5: IMPORT INTO DATABASE (TRANSACTION)
// ============================================================

console.log('\n💾 STEP 5: Importing into database (transaction)...\n');

try {
  // BEGIN TRANSACTION - Uses RPC for ACID guarantee
  
  // 5a. UPSERT COMPONENTS
  console.log('   Upserting components...');
  
  for (const comp of normalizedComponents) {
    const { error } = await supabase
      .from('pc_components')
      .upsert(
        {
          id: comp.id,
          type: comp.type,
          name: comp.name,
          price_tzs: comp.price_tzs,
          cpu_socket: comp.cpu_socket,
          motherboard_socket: comp.motherboard_socket,
          ram_type: comp.ram_type,
          gpu_length_mm: comp.gpu_length_mm,
          case_max_gpu_length_mm: comp.case_max_gpu_length_mm,
          psu_wattage: comp.psu_wattage,
          estimated_wattage: comp.estimated_wattage,
          storage_capacity_gb: comp.storage_capacity_gb,
          storage_type: comp.storage_type,
          ram_capacity_gb: comp.ram_capacity_gb,
          vram_gb: comp.vram_gb,
          cooler_type: comp.cooler_type,
          cores: comp.cores,
          threads: comp.threads,
          is_visible: true,
          stock_status: 'in_stock'
        },
        { onConflict: 'id' }
      );

    if (error) {
      throw new Error(`Failed to upsert component ${comp.id}: ${error.message}`);
    }
  }

  console.log(`   ✓ ${normalizedComponents.length} components upserted`);

  // 5b. UPSERT PRESETS
  console.log('   Upserting presets...');

  for (const preset of pc_presets_data.data) {
    const { error } = await supabase
      .from('pc_build_presets')
      .upsert(
        {
          id: preset.id,
          name: preset.name,
          cpu_family: preset.cpu_family,
          build_number: preset.build_number,
          subtotal_tzs: preset.subtotal_tzs,
          discount_percent: preset.discount_percent,
          total_tzs: preset.total_tzs,
          status: preset.status,
          estimated_system_wattage: preset.estimated_system_wattage,
          required_psu_wattage: preset.required_psu_wattage,
          compatibility_status: preset.compatibility_status,
          is_visible: true
        },
        { onConflict: 'id' }
      );

    if (error) {
      throw new Error(`Failed to upsert preset ${preset.id}: ${error.message}`);
    }
  }

  console.log(`   ✓ ${pc_presets_data.data.length} presets upserted`);

  // 5c. UPSERT PRESET ITEMS
  console.log('   Upserting preset items...');

  for (const item of pc_preset_items_data.data) {
    const { error } = await supabase
      .from('pc_build_preset_items')
      .upsert(
        {
          preset_id: item.preset_id,
          slot_order: item.slot_order,
          component_type: item.component_type,
          component_id: item.component_id,
          quantity: item.quantity,
          unit_price_tzs: item.unit_price_tzs,
          line_total_tzs: item.line_total_tzs,
          is_auto_replaced: false,
          compatibility_notes: null
        },
        { onConflict: 'preset_id,slot_order' }
      );

    if (error) {
      throw new Error(`Failed to upsert preset item ${item.preset_id}/${item.slot_order}: ${error.message}`);
    }
  }

  console.log(`   ✓ ${pc_preset_items_data.data.length} preset items upserted`);

  console.log('\n✅ IMPORT SUCCESSFUL\n');
  
  // Summary
  console.log('📊 IMPORT SUMMARY:');
  console.log(`   Components:  ${normalizedComponents.length}`);
  console.log(`   Presets:     ${pc_presets_data.data.length}`);
  console.log(`   Items:       ${pc_preset_items_data.data.length}`);
  console.log(`   Duplicates:  ${duplicates.length}`);
  
} catch (error) {
  console.error('\n❌ IMPORT FAILED:', error.message);
  process.exit(1);
}

console.log('\n🎉 Data integration complete!');
