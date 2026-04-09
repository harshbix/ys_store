import fs from 'fs';

console.log('🔧 Fixing motherboard RAM types...\n');

const componentsData = JSON.parse(fs.readFileSync('./pc_components.seed.json', 'utf8'));
const specOverridesData = JSON.parse(fs.readFileSync('./pc_spec_overrides.seed.json', 'utf8'));

// Build override map
const overridesMap = {};
specOverridesData.data.forEach(override => {
  overridesMap[override.component_id] = override.overrides;
});

// Check what's in overrides for motherboards
console.log('📋 Checking motherboard specs in overrides...\n');

let updated = 0;

componentsData.data = componentsData.data.map(comp => {
  if (comp.type === 'motherboard' && !comp.motherboard_ram_type) {
    const override = overridesMap[comp.id];
    if (override?.motherboard_ram_type) {
      comp.motherboard_ram_type = override.motherboard_ram_type;
      updated++;
    } else {
      // Default to DDR5 for modern boards, or detect from name
      if (comp.name.includes('B650') || comp.name.includes('B950')) {
        comp.motherboard_ram_type = 'DDR5';
        updated++;
      } else if (comp.name.includes('B660') || comp.name.includes('B560')) {
        comp.motherboard_ram_type = 'DDR5';
        updated++;
      } else {
        // Default fallback
        comp.motherboard_ram_type = 'DDR5';
        updated++;
      }
    }
  }
  return comp;
});

console.log(`✅ Added motherboard_ram_type to ${updated} motherboards`);

// Write back
fs.writeFileSync(
  './pc_components.seed.json',
  JSON.stringify(componentsData, null, 2),
  'utf8'
);

console.log('\n✅ Updated pc_components.seed.json');
