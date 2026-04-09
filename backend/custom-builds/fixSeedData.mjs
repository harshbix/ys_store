import fs from 'fs';

console.log('🔧 Fixing seed data...\n');

// Load current seed data
const componentsData = JSON.parse(fs.readFileSync('./pc_components.seed.json', 'utf8'));
const components = componentsData.data;

// ===== FIX 1: REMOVE DUPLICATE COMPONENTS =====
console.log('📋 Removing duplicate components...');

const seen = {};
const cleaned = [];
const removed = [];

components.forEach(comp => {
  const key = `${comp.name.toLowerCase()}::${comp.type.toLowerCase()}`;
  
  if (seen[key]) {
    removed.push(comp.id);
  } else {
    seen[key] = comp.id;
    
    // ===== FIX 2: ADD MISSING estimated_wattage FOR PSUs =====
    if (comp.type === 'psu' && !comp.estimated_wattage) {
      comp.estimated_wattage = 10; // PSUs consume ~10W themselves
      console.log(`   Fixed: ${comp.id} - added estimated_wattage=10`);
    }
    
    cleaned.push(comp);
  }
});

console.log(`✅ Removed ${removed.length} duplicates: ${removed.join(', ')}`);

// Write cleaned data back
componentsData.data = cleaned;
fs.writeFileSync(
  './pc_components.seed.json',
  JSON.stringify(componentsData, null, 2),
  'utf8'
);

console.log(`\n✅ Updated pc_components.seed.json`);
console.log(`   Total components: ${components.length} → ${cleaned.length}`);
