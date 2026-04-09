import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const workbookPath = './custom builds/pc_builds_master_populated.xlsx';
const outputDir = './custom-builds';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read workbook
const workbook = XLSX.readFile(workbookPath);

console.log('📖 Reading XLSX...\n');

// ===== EXTRACT COMPONENTS =====
const componentsSheet = workbook.Sheets['Components'];
const componentsData = XLSX.utils.sheet_to_json(componentsSheet, { header: 1 });

const componentsHeaders = componentsData[2]; // Row 3 (index 2)
const componentsRecords = componentsData.slice(3); // Start from row 4

const components = componentsRecords
  .filter(row => row[0]) // Has component_id
  .map(row => ({
    id: row[0],
    type: row[1],
    name: row[2],
    price_tzs: Number(row[3]) || 0,
    cpu_socket: row[4] || null,
    motherboard_socket: row[5] || null,
    ram_type: row[6] || null,
    gpu_length_mm: row[7] ? Number(row[7]) : null,
    case_max_gpu_length_mm: row[8] ? Number(row[8]) : null,
    psu_wattage: row[9] ? Number(row[9]) : null,
    estimated_wattage: row[10] ? Number(row[10]) : null,
    storage_capacity_gb: row[11] ? Number(row[11]) : null,
    storage_type: row[12] || null,
    ram_capacity_gb: row[13] ? Number(row[13]) : null,
    vram_gb: row[14] ? Number(row[14]) : null,
    cooler_type: row[15] || null,
    cores: row[16] ? Number(row[16]) : null,
    threads: row[17] ? Number(row[17]) : null
  }));

console.log(`✅ Extracted ${components.length} components`);

// ===== EXTRACT PRESETS =====
const presetsSheet = workbook.Sheets['Presets'];
const presetsData = XLSX.utils.sheet_to_json(presetsSheet, { header: 1 });

const presetsHeaders = presetsData[2]; // Row 3 (index 2)
const presetsRecords = presetsData.slice(3); // Start from row 4

const presets = presetsRecords
  .filter(row => row[0]) // Has preset_id
  .map(row => ({
    id: row[0],
    name: row[3],
    cpu_family: row[1],
    build_number: Number(row[2]) || 0,
    subtotal_tzs: Number(row[9]) || Number(row[6]) || 0,
    discount_percent: Number(row[7]) || 0,
    total_tzs: Number(row[10]) || Number(row[8]) || 0,
    status: 'draft',
    estimated_system_wattage: row[11] ? Number(row[11]) : 0,
    required_psu_wattage: row[12] ? Number(row[12]) : 0,
    compatibility_status: row[13] || 'unknown'
  }));

console.log(`✅ Extracted ${presets.length} presets`);

// ===== EXTRACT PRESET ITEMS =====
const presetItemsSheet = workbook.Sheets['Preset_Items'];
const presetItemsData = XLSX.utils.sheet_to_json(presetItemsSheet, { header: 1 });

const presetItemsHeaders = presetItemsData[2]; // Row 3 (index 2)
const presetItemsRecords = presetItemsData.slice(3); // Start from row 4

const presetItems = presetItemsRecords
  .filter(row => row[0]) // Has preset_id
  .map(row => ({
    preset_id: row[0],
    slot_order: Number(row[1]) || 0,
    component_type: row[2],
    component_id: row[3],
    component_name: row[4],
    quantity: Number(row[5]) || 1,
    unit_price_tzs: Number(row[6]) || 0,
    line_total_tzs: Number(row[7]) || 0
  }));

console.log(`✅ Extracted ${presetItems.length} preset items`);

// ===== EXTRACT SPEC OVERRIDES =====
const specOverridesSheet = workbook.Sheets['Spec_Overrides'];
const specOverridesData = XLSX.utils.sheet_to_json(specOverridesSheet, { header: 1 });

const specOverridesHeaders = specOverridesData[2]; // Row 3 (index 2)
const specOverridesRecords = specOverridesData.slice(3); // Start from row 4

const specOverrides = specOverridesRecords
  .filter(row => row[0]) // Has component_id
  .map(row => {
    try {
      const overrideJson = row[2] ? JSON.parse(row[2]) : {};
      return {
        component_id: row[0],
        component_type: row[1],
        component_name: row[2],
        overrides: overrideJson,
        confidence: row[3] || 'unknown',
        rationale: row[4] || ''
      };
    } catch (err) {
      return {
        component_id: row[0],
        component_type: row[1],
        component_name: row[2],
        overrides: {},
        confidence: row[3] || 'unknown',
        rationale: row[4] || ''
      };
    }
  });

console.log(`✅ Extracted ${specOverrides.length} spec overrides`);

// ===== WRITE SEED JSON FILES =====

const pc_components = {
  __metadata: {
    source: 'pc_builds_master_populated.xlsx',
    sheet: 'Components',
    date_generated: new Date().toISOString(),
    total_records: components.length
  },
  data: components
};

const pc_presets = {
  __metadata: {
    source: 'pc_builds_master_populated.xlsx',
    sheet: 'Presets',
    date_generated: new Date().toISOString(),
    total_records: presets.length
  },
  data: presets
};

const pc_preset_items = {
  __metadata: {
    source: 'pc_builds_master_populated.xlsx',
    sheet: 'Preset_Items',
    date_generated: new Date().toISOString(),
    total_records: presetItems.length
  },
  data: presetItems
};

const pc_spec_overrides = {
  __metadata: {
    source: 'pc_builds_master_populated.xlsx',
    sheet: 'Spec_Overrides',
    date_generated: new Date().toISOString(),
    total_records: specOverrides.length
  },
  data: specOverrides
};

// Write files
fs.writeFileSync(
  path.join(outputDir, 'pc_components.seed.json'),
  JSON.stringify(pc_components, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(outputDir, 'pc_presets.seed.json'),
  JSON.stringify(pc_presets, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(outputDir, 'pc_preset_items.seed.json'),
  JSON.stringify(pc_preset_items, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(outputDir, 'pc_spec_overrides.seed.json'),
  JSON.stringify(pc_spec_overrides, null, 2),
  'utf8'
);

console.log('\n📝 Seed files created:');
console.log(`   ✓ ${outputDir}/pc_components.seed.json`);
console.log(`   ✓ ${outputDir}/pc_presets.seed.json`);
console.log(`   ✓ ${outputDir}/pc_preset_items.seed.json`);
console.log(`   ✓ ${outputDir}/pc_spec_overrides.seed.json`);
console.log('\n✅ Extraction complete!');
