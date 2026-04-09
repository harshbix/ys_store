import fs from 'fs';

console.log('🔍 Checking referential integrity...\n');

const componentsData = JSON.parse(fs.readFileSync('./pc_components.seed.json', 'utf8')).data;
const presetItemsData = JSON.parse(fs.readFileSync('./pc_preset_items.seed.json', 'utf8')).data;

// Build set of component IDs
const componentIds = new Set(componentsData.map(c => c.id));

console.log(`Components available: ${componentIds.size}`);
console.log(`Preset items: ${presetItemsData.length}\n`);

// Find orphaned references
const orphaned = [];
const componentTypeCounts = {};

presetItemsData.forEach(item => {
  if (!componentIds.has(item.component_id)) {
    orphaned.push({
      preset_id: item.preset_id,
      component_id: item.component_id,
      component_type: item.component_type,
      component_name: item.component_name
    });
  }
  
  if (!componentTypeCounts[item.component_type]) {
    componentTypeCounts[item.component_type] = 0;
  }
  componentTypeCounts[item.component_type]++;
});

if (orphaned.length === 0) {
  console.log('✅ All component references are valid');
} else {
  console.log(`❌ Found ${orphaned.length} orphaned component references:\n`);
  orphaned.slice(0, 10).forEach(item => {
    console.log(`   Preset ${item.preset_id}: component ${item.component_id} (${item.component_type})`);
    console.log(`      Name: ${item.component_name}`);
  });
  if (orphaned.length > 10) {
    console.log(`   ... and ${orphaned.length - 10} more`);
  }
}

console.log('\n📊 Component types in preset items:');
Object.entries(componentTypeCounts).forEach(([type, count]) => {
  const available = componentsData.filter(c => c.type === type).length;
  console.log(`   ${type}: ${count} references, ${available} components available`);
});

if (orphaned.length > 0) {
  console.log('\n⚠️ Need to add missing components to pc_components.seed.json');
  const missingIds = new Set(orphaned.map(o => o.component_id));
  console.log(`Missing component IDs: ${Array.from(missingIds).join(', ')}`);
}
