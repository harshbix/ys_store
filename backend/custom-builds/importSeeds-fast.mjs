import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('📂 PC BUILDER SEED IMPORT (BATCHED - FAST)\n');

// Load seed files
const componentsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'pc_components.seed.json'), 'utf8')).data;
const presetsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'pc_presets.seed.json'), 'utf8')).data;
const presetItemsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'pc_preset_items.seed.json'), 'utf8')).data;

console.log(`📋 Loaded data:`);
console.log(`   Components: ${componentsData.length}`);
console.log(`   Presets: ${presetsData.length}`);
console.log(`   Preset Items: ${presetItemsData.length}\n`);

try {
  // BATCH 1: Components (51 rows)
  console.log('⏳ Importing components (batched)...');
  const componentBatch = componentsData.map(comp => ({
    id: comp.id,
    type: comp.type,
    name: comp.name,
    price_tzs: comp.price_tzs,
    cpu_socket: comp.cpu_socket,
    motherboard_socket: comp.motherboard_socket,
    motherboard_ram_type: comp.motherboard_ram_type,
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
    threads: comp.threads
  }));

  const { error: compError } = await supabase
    .from('pc_components')
    .upsert(componentBatch, { onConflict: 'id' });

  if (compError) throw new Error(`Components: ${compError.message}`);
  console.log(`✅ ${componentBatch.length} components imported\n`);

  // BATCH 2: Presets (147 rows)
  console.log('⏳ Importing presets (batched)...');
  const presetBatch = presetsData.map(preset => ({
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
    compatibility_status: preset.compatibility_status
  }));

  const { error: presetError } = await supabase
    .from('pc_build_presets')
    .upsert(presetBatch, { onConflict: 'id' });

  if (presetError) throw new Error(`Presets: ${presetError.message}`);
  console.log(`✅ ${presetBatch.length} presets imported\n`);

  // BATCH 3: Preset Items (1470 rows - do in chunks of 500)
  console.log('⏳ Importing preset items (batched in chunks)...');
  const CHUNK_SIZE = 500;
  let totalImported = 0;

  for (let i = 0; i < presetItemsData.length; i += CHUNK_SIZE) {
    const chunk = presetItemsData.slice(i, i + CHUNK_SIZE).map(item => ({
      preset_id: item.preset_id,
      slot_order: item.slot_order,
      component_type: item.component_type,
      component_id: item.component_id,
      quantity: item.quantity,
      unit_price_tzs: item.unit_price_tzs,
      line_total_tzs: item.line_total_tzs,
      is_auto_replaced: false,
      compatibility_notes: null
    }));

    const { error: itemError } = await supabase
      .from('pc_build_preset_items')
      .upsert(chunk, { onConflict: 'preset_id,slot_order' });

    if (itemError) throw new Error(`Items chunk ${i}: ${itemError.message}`);
    
    totalImported += chunk.length;
    const percent = Math.round((totalImported / presetItemsData.length) * 100);
    process.stdout.write(`\r   Progress: ${totalImported}/${presetItemsData.length} (${percent}%)`);
  }

  console.log(`\n✅ ${totalImported} preset items imported\n`);

  console.log('🎉 IMPORT COMPLETE!\n');
  console.log('📊 Summary:');
  console.log(`   ✓ Components:  ${componentBatch.length}`);
  console.log(`   ✓ Presets:     ${presetBatch.length}`);
  console.log(`   ✓ Items:       ${totalImported}`);
  console.log(`   ✓ Total:       ${componentBatch.length + presetBatch.length + totalImported}\n`);

} catch (error) {
  console.error('\n❌ IMPORT FAILED:', error.message);
  process.exit(1);
}
