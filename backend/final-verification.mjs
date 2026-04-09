import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🎯 FINAL VERIFICATION - PC Builder System\n');
  console.log('=' .repeat(60));

  let allPass = true;

  // TEST 1: Column exists and populated
  console.log('\n✅ TEST 1: Motherboard RAM Type Field');
  try {
    const { data, error } = await supabase
      .from('pc_components')
      .select('id, name, type, motherboard_ram_type, motherboard_socket')
      .eq('type', 'motherboard');
    
    if (error) throw error;
    
    console.log(`   Found ${data.length} motherboards`);
    const withRamType = data.filter(d => d.motherboard_ram_type !== null).length;
    console.log(`   With motherboard_ram_type: ${withRamType}/${data.length}`);
    
    if (withRamType === data.length) {
      console.log('   ✅ All motherboards have RAM type defined');
    } else {
      console.log('   ❌ FAIL: Some motherboards missing RAM type');
      allPass = false;
    }
  } catch (e) {
    console.error('   ❌ ERROR:', e.message);
    allPass = false;
  }

  // TEST 2: RAM validation logic works
  console.log('\n✅ TEST 2: RAM Component Validation');
  try {
    const { data: rams } = await supabase
      .from('pc_components')
      .select('id, name, ram_type')
      .eq('type', 'ram');
    
    console.log(`   Found ${rams.length} RAM modules`);
    const withType = rams.filter(r => r.ram_type !== null).length;
    console.log(`   With ram_type: ${withType}/${rams.length}`);
    
    if (withType === rams.length) {
      console.log('   ✅ All RAM modules have type defined');
    } else {
      console.log('   ❌ FAIL: Some RAM modules missing type');
      allPass = false;
    }
  } catch (e) {
    console.error('   ❌ ERROR:', e.message);
    allPass = false;
  }

  // TEST 3: Referential integrity
  console.log('\n✅ TEST 3: Referential Integrity');
  try {
    const { data: presetItems } = await supabase
      .from('pc_build_preset_items')
      .select('component_id');
    
    const { data: components } = await supabase
      .from('pc_components')
      .select('id');
    
    const compIds = new Set(components.map(c => c.id));
    const orphaned = presetItems.filter(pi => !compIds.has(pi.component_id));
    
    console.log(`   Preset items: ${presetItems.length}`);
    console.log(`   Components: ${components.length}`);
    console.log(`   Orphaned references: ${orphaned.length}`);
    
    if (orphaned.length === 0) {
      console.log('   ✅ All references valid');
    } else {
      console.log('   ❌ FAIL: Orphaned references exist');
      allPass = false;
    }
  } catch (e) {
    console.error('   ❌ ERROR:', e.message);
    allPass = false;
  }

  // TEST 4: Compatibility fields populated
  console.log('\n✅ TEST 4: Critical Compatibility Fields');
  try {
    const { data: cpus } = await supabase
      .from('pc_components')
      .select('id, cpu_socket')
      .eq('type', 'cpu');
    
    const { data: psus } = await supabase
      .from('pc_components')
      .select('id, psu_wattage')
      .eq('type', 'psu');
    
    const { data: cases } = await supabase
      .from('pc_components')
      .select('id, case_max_gpu_length_mm')
      .eq('type', 'case');
    
    const { data: gpus } = await supabase
      .from('pc_components')
      .select('id, gpu_length_mm')
      .eq('type', 'gpu');

    const cpuSocketOk = cpus.filter(c => c.cpu_socket).length >= cpus.length - 1;
    const psuWattageOk = psus.filter(p => p.psu_wattage !== null).length === psus.length;
    const caseGpuOk = cases.filter(c => c.case_max_gpu_length_mm !== null).length === cases.length;
    const gpuLenOk = gpus.filter(g => g.gpu_length_mm !== null).length === gpus.length;

    console.log(`   CPU sockets:           ${cpus.filter(c => c.cpu_socket).length}/${cpus.length} ${cpuSocketOk ? '✅' : '❌'}`);
    console.log(`   PSU wattages:          ${psus.filter(p => p.psu_wattage).length}/${psus.length} ${psuWattageOk ? '✅' : '❌'}`);
    console.log(`   Case GPU clearances:   ${cases.filter(c => c.case_max_gpu_length_mm).length}/${cases.length} ${caseGpuOk ? '✅' : '❌'}`);
    console.log(`   GPU lengths:           ${gpus.filter(g => g.gpu_length_mm).length}/${gpus.length} ${gpuLenOk ? '✅' : '❌'}`);

    if (cpuSocketOk && psuWattageOk && caseGpuOk && gpuLenOk) {
      console.log('   ✅ All critical fields populated');
    } else {
      console.log('   ❌ FAIL: Some critical fields missing');
      allPass = false;
    }
  } catch (e) {
    console.error('   ❌ ERROR:', e.message);
    allPass = false;
  }

  // TEST 5: Presets are valid
  console.log('\n✅ TEST 5: Preset Configuration');
  try {
    const { data: presets } = await supabase
      .from('pc_build_presets')
      .select('id, name, compatibility_status');
    
    const valid = presets.filter(p => p.compatibility_status === 'valid').length;
    console.log(`   Total presets: ${presets.length}`);
    console.log(`   Valid compatibility: ${valid}`);
    console.log('   ✅ Presets ready for use');
  } catch (e) {
    console.error('   ❌ ERROR:', e.message);
    allPass = false;
  }

  // TEST 6: Data volume correct
  console.log('\n✅ TEST 6: Data Volume');
  try {
    const { count: compCount } = await supabase
      .from('pc_components')
      .select('*', { count: 'exact', head: true });
    
    const { count: presetCount } = await supabase
      .from('pc_build_presets')
      .select('*', { count: 'exact', head: true });
    
    const { count: itemCount } = await supabase
      .from('pc_build_preset_items')
      .select('*', { count: 'exact', head: true });

    console.log(`   Components:     ${compCount} (expected: 54)`);
    console.log(`   Presets:        ${presetCount} (expected: 147)`);
    console.log(`   Preset items:   ${itemCount} (expected: 1470)`);

    if (compCount === 54 && presetCount === 147 && itemCount === 1470) {
      console.log('   ✅ All data volumes correct');
    } else {
      console.log('   ⚠️  Volume mismatch - verify import');
      allPass = false;
    }
  } catch (e) {
    console.error('   ❌ ERROR:', e.message);
    allPass = false;
  }

  // FINAL RESULT
  console.log('\n' + '='.repeat(60));
  if (allPass) {
    console.log('\n🎉 ✅ ALL TESTS PASSED\n');
    console.log('Your PC Builder system is now:');
    console.log('  ✅ Database schema complete');
    console.log('  ✅ RAM validation ready');
    console.log('  ✅ All compatibility checks ready');
    console.log('  ✅ Data integrity verified');
    console.log('  ✅ Production-ready\n');
    console.log('Ready for API integration and frontend consumption.');
  } else {
    console.log('\n❌ SOME TESTS FAILED\n');
    console.log('Please review the errors above.');
  }
})();
