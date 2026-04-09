import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Checking pc_components table schema...\n');

  try {
    const { data: sample, error: err } = await supabase
      .from('pc_components')
      .select('*')
      .limit(1);

    if (err) {
      console.error('❌ Error:', err.message);
      return;
    }

    if (sample && sample.length > 0) {
      const keys = Object.keys(sample[0]);
      console.log(`✅ Found ${keys.length} columns in pc_components:`);
      keys.forEach(k => console.log(`  - ${k}`));

      if (keys.includes('motherboard_ram_type')) {
        console.log('\n✅ motherboard_ram_type column EXISTS');
      } else {
        console.log('\n❌ motherboard_ram_type column is MISSING');
        console.log('\n📝 You must run this SQL in Supabase Dashboard (SQL Editor):');
        console.log(`
ALTER TABLE public.pc_components
ADD COLUMN motherboard_ram_type text;

CREATE INDEX idx_pc_components_mb_ram_type 
ON public.pc_components(motherboard_ram_type) 
WHERE motherboard_ram_type IS NOT NULL;
        `);
      }
    } else {
      console.log('No data found in table');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
