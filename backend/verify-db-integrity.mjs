import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CHECK 1: RAM Compatibility Field ===');
  try {
    const { data, error } = await supabase
      .from('pc_components')
      .select('id, name, type, motherboard_ram_type, ram_type')
      .eq('type', 'motherboard')
      .limit(5);
    
    if (error) throw error;
    console.log('✅ Motherboard samples:');
    data.forEach(d => {
      console.log(`  ${d.id}: ${d.name}`);
      console.log(`    - ram_type: ${d.ram_type}`);
      console.log(`    - motherboard_ram_type: ${d.motherboard_ram_type}`);
    });
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  }

  console.log('\n=== CHECK 2: Duplicates ===');
  try {
    const { data, error } = await supabase
      .from('pc_components')
      .select('name, type')
      .order('name');
    
    if (error) throw error;
    const groups = {};
    data.forEach(d => {
      const key = `${d.name}__${d.type}`;
      groups[key] = (groups[key] || 0) + 1;
    });
    const dups = Object.entries(groups).filter(([_, count]) => count > 1);
    if (dups.length === 0) {
      console.log('✅ No duplicates found');
    } else {
      console.log(`❌ ${dups.length} duplicate groups found:`);
      dups.forEach(([key, count]) => {
        console.log(`  ${key}: ${count} records`);
      });
    }
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  }

  console.log('\n=== CHECK 3: Orphaned References ===');
  try {
    const { data: orphaned, error } = await supabase
      .from('pc_build_preset_items')
      .select('id, component_id')
      .not('component_id', 'is', null);
    
    if (error) throw error;
    
    const { data: components, error: err2 } = await supabase
      .from('pc_components')
      .select('id');
    
    if (err2) throw err2;
    
    const compIds = new Set(components.map(c => c.id));
    const orphanedItems = orphaned.filter(item => !compIds.has(item.component_id));
    
    if (orphanedItems.length === 0) {
      console.log('✅ All preset items reference valid components');
    } else {
      console.log(`❌ ${orphanedItems.length} orphaned references found:`);
      orphanedItems.slice(0, 5).forEach(item => {
        console.log(`  Item ${item.id} -> component ${item.component_id} (missing)`);
      });
    }
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  }

  console.log('\n=== CHECK 4: NULL Compatibility Fields ===');
  try {
    const { data, error } = await supabase
      .from('pc_components')
      .select('id, type, cpu_socket, motherboard_socket, ram_type, psu_wattage, motherboard_ram_type');
    
    if (error) throw error;

    const critical = data.filter(d => {
      if (d.type === 'cpu' && d.cpu_socket === null) return true;
      if (d.type === 'motherboard' && (d.motherboard_socket === null || d.motherboard_ram_type === null)) return true;
      if (d.type === 'ram' && d.ram_type === null) return true;
      if (d.type === 'psu' && d.psu_wattage === null) return true;
      if (d.type === 'gpu' && d.gpu_length_mm === null) return true;
      if (d.type === 'case' && d.case_max_gpu_length_mm === null) return true;
      return false;
    });

    if (critical.length === 0) {
      console.log('✅ All critical compatibility fields are populated');
    } else {
      console.log(`❌ ${critical.length} components with missing critical fields:`);
      critical.slice(0, 10).forEach(d => {
        console.log(`  ${d.id} (${d.type}): socket=${d.cpu_socket}, mb_socket=${d.motherboard_socket}, mb_ram=${d.motherboard_ram_type}, ram=${d.ram_type}, psu=${d.psu_wattage}`);
      });
    }
  } catch (e) {
    console.error('❌ ERROR:', e.message);
  }

  console.log('\n=== SUMMARY ===');
  console.log('Run this to fix RAM field issues:');
  console.log('  node fix-motherboard-ram.mjs');
  console.log('\nAll checks completed.');
})();
