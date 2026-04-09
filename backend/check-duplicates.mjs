import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CASE COMPONENTS ===');
  const { data: cases } = await supabase
    .from('pc_components')
    .select('id, name, type, price_tzs')
    .eq('type', 'case');
  
  console.log('\nAll case components:');
  cases.forEach(c => console.log(`  ${c.id}: ${c.name} (${c.price_tzs} TZS)`));
  
  console.log('\nReferences in preset items:');
  for (const comp of cases) {
    const { data: items } = await supabase
      .from('pc_build_preset_items')
      .select('preset_id')
      .eq('component_id', comp.id);
    
    if (items.length > 0) {
      console.log(`  ${comp.id}: ${items.length} preset items`);
      console.log(`    Presets: ${items.map(i => i.preset_id).slice(0, 3).join(', ')}`);
    } else {
      console.log(`  ${comp.id}: 0 preset items (UNUSED - safe to delete)`);
    }
  }

  console.log('\n=== DUPLICATE ISSUE ===');
  console.log('Found 2 cases with name "atx black/white chassis"');
  console.log('Strategy: Keep the one WITH references, delete the unused one');
})();
