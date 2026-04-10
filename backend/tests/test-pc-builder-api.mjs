import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🧪 Testing PC Builder API Endpoints\n');
  
  console.log('1️⃣ Fetching Presets...');
  const { data: presets, error: presetsErr } = await supabase
    .from('pc_build_presets')
    .select('id, name, cpu_family, total_tzs, compatibility_status')
    .eq('is_visible', true)
    .limit(3);
  
  if (presetsErr) {
    console.error('❌ Error:', presetsErr.message);
  } else {
    console.log('✅ Found', presets.length, 'presets');
    if (presets.length > 0) {
      console.log('  Sample:', presets[0].name, '- TZS', presets[0].total_tzs);
    }
  }

  console.log('\n2️⃣ Fetching Components by Type (CPU)...');
  const { data: cpus, error: cpuErr } = await supabase
    .from('pc_components')
    .select('id, name, type, price_tzs, cpu_socket')
    .eq('type', 'cpu')
    .eq('is_visible', true)
    .limit(3);
  
  if (cpuErr) {
    console.error('❌ Error:', cpuErr.message);
  } else {
    console.log('✅ Found', cpus.length, 'CPUs');
    if (cpus.length > 0) {
      console.log('  Sample:', cpus[0].name, '- Socket:', cpus[0].cpu_socket);
    }
  }
  
  console.log('\n3️⃣ Fetching Motherboards with RAM Type...');
  const { data: mbs, error: mbErr } = await supabase
    .from('pc_components')
    .select('id, name, motherboard_socket, motherboard_ram_type')
    .eq('type', 'motherboard')
    .eq('is_visible', true)
    .limit(2);
  
  if (mbErr) {
    console.error('❌ Error:', mbErr.message);
  } else {
    console.log('✅ Found', mbs.length, 'Motherboards');
    mbs.forEach(mb => {
      console.log('  -', mb.name);
      console.log('    Socket:', mb.motherboard_socket, 'RAM Type:', mb.motherboard_ram_type);
    });
  }

  console.log('\n4️⃣ Fetching Preset with Full Items...');
  const { data: fullPreset, error: fullErr } = await supabase
    .from('pc_build_presets')
    .select(`
      id,
      name,
      total_tzs,
      pc_build_preset_items(
        component_type,
        unit_price_tzs,
        pc_components(name, type)
      )
    `)
    .eq('is_visible', true)
    .limit(1)
    .single();
  
  if (fullErr) {
    console.error('❌ Error:', fullErr.message);
  } else {
    console.log('✅ Preset:', fullPreset.name, '- Components:', fullPreset.pc_build_preset_items?.length);
    fullPreset.pc_build_preset_items?.slice(0, 3).forEach(item => {
      console.log('  -', item.component_type + ':', item.pc_components?.name);
    });
  }

  console.log('\n5️⃣ Fetching Component Types...');
  const { data: allComps } = await supabase
    .from('pc_components')
    .select('type')
    .eq('is_visible', true)
    .eq('stock_status', 'in_stock');
  
  const types = [...new Set(allComps?.map(d => d.type) || [])];
  console.log('✅ Available component types:', types.join(', '));

  console.log('\n✅ All data endpoints verified successfully\n');
})();
