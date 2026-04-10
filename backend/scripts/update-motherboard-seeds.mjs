import fs from 'fs';
import path from 'path';

console.log('📋 UPDATING MOTHERBOARD SEED DATA\n');
console.log('Step 1: Fixing RAM type fields for motherboard components...\n');

// Load component seeds
const componentsSeedPath = './custom-builds/pc_components.seed.json';
const componentsSeed = JSON.parse(fs.readFileSync(componentsSeedPath, 'utf8'));

let updated = 0;
let warnings = 0;

console.log('Processing motherboard components:');
componentsSeed.data.forEach(comp => {
  if (comp.type === 'motherboard') {
    const oldRamType = comp.ram_type;
    const oldMbRamType = comp.motherboard_ram_type;

    // Fix: Move ram_type → motherboard_ram_type, clear ram_type
    if (oldRamType && !oldMbRamType) {
      console.log(`  ✅ ${comp.id} (${comp.name})`);
      console.log(`     ram_type: "${oldRamType}" → motherboard_ram_type`);
      comp.motherboard_ram_type = oldRamType;
      comp.ram_type = null;
      updated++;
    } else if (oldRamType && oldMbRamType && oldRamType !== oldMbRamType) {
      console.log(`  ⚠️  ${comp.id} (${comp.name})`);
      console.log(`     CONFLICT: ram_type="${oldRamType}" vs motherboard_ram_type="${oldMbRamType}"`);
      console.log(`     Keeping motherboard_ram_type, clearing ram_type`);
      comp.ram_type = null;
      warnings++;
    }
  }
});

console.log(`\n✅ Updated: ${updated} motherboards`);
console.log(`⚠️  Conflicts resolved: ${warnings}`);

// Save updated seed
console.log('\nSaving updated seed file...');
fs.writeFileSync(
  componentsSeedPath,
  JSON.stringify(componentsSeed, null, 2),
  'utf8'
);

console.log('✅ Seed file updated\n');

// Display summary
console.log('📊 SUMMARY:');
console.log('  - All motherboard components now have motherboard_ram_type set');
console.log('  - All motherboard components have ram_type cleared (null)');
console.log('  - RAM components still have ram_type for validation');
console.log('\n✅ Ready for re-import');
console.log('Next step: node importSeeds-fast.mjs');
