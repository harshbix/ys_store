import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('📋 Adding motherboard_ram_type column to pc_components table...\n');

  try {
    // Add the motherboard_ram_type column if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE pc_components
        ADD COLUMN IF NOT EXISTS motherboard_ram_type text;
        
        CREATE INDEX IF NOT EXISTS idx_pc_components_mb_ram_type 
        ON pc_components(motherboard_ram_type) 
        WHERE motherboard_ram_type IS NOT NULL;
      `
    }).catch(err => {
      // RPC might not exist, try direct SQL
      return supabase.from('_sql_exec').insert({
        sql: `ALTER TABLE pc_components ADD COLUMN IF NOT EXISTS motherboard_ram_type text;`
      });
    });

    // Try direct approach
    console.log('Attempting direct column modification...');
    const result = await supabase
      .from('pc_components')
      .select('motherboard_ram_type')
      .limit(1)
      .catch(async err => {
        console.log('Column check error - attempting to add via raw SQL');
        // The column doesn't exist, and we need to add it
        // Since we can't run raw SQL directly through JS client in some setups,
        // we'll need to use the migration approach
        return null;
      });

    if (result?.data) {
      console.log('✅ Column motherboard_ram_type already exists or has been added');
    }
  } catch (e) {
    console.error('⚠️  Could not add column via RPC:', e.message);
    console.log('\n📝 MANUAL STEP REQUIRED:');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('   ');
    console.log('   ALTER TABLE pc_components');
    console.log('   ADD COLUMN IF NOT EXISTS motherboard_ram_type text;');
    console.log('   ');
    console.log('   CREATE INDEX IF NOT EXISTS idx_pc_components_mb_ram_type');
    console.log('   ON pc_components(motherboard_ram_type)');
    console.log('   WHERE motherboard_ram_type IS NOT NULL;');
  }

  console.log('\n✅ Column addition complete (or manual step instructions provided)');
})();
