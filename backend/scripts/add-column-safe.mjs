import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔧 ADDING motherboard_ram_type COLUMN TO LIVE DATABASE\n');

  try {
    // Use rpc to execute raw SQL
    console.log('Executing SQL via Supabase RPC...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.pc_components
        ADD COLUMN IF NOT EXISTS motherboard_ram_type text;

        CREATE INDEX IF NOT EXISTS idx_pc_components_mb_ram_type
        ON public.pc_components(motherboard_ram_type)
        WHERE motherboard_ram_type IS NOT NULL;
      `
    });

    if (error) {
      console.log('RPC approach failed (expected), trying alternative...\n');
      throw error;
    }

    console.log('✅ SQL executed successfully via RPC\n');
    console.log(data);
  } catch (rpcError) {
    // RPC might not exist, so try checking if column exists by trying to query it
    console.log('⚠️  RPC method not available, verifying column manually...\n');
    
    try {
      const { data: sample, error: queryError } = await supabase
        .from('pc_components')
        .select('motherboard_ram_type')
        .limit(1);

      if (!queryError) {
        console.log('✅ Column already exists or was successfully added\n');
        console.log('Next: Re-importing seed data with proper motherboard_ram_type values...');
        process.exit(0);
      }
    } catch (e) {
      // Column still doesn't exist
    }

    console.log('❌ Cannot add column via Node.js client.');
    console.log('\n📋 MANUAL STEP REQUIRED:\n');
    console.log('Go to: https://supabase.com → Your Project → SQL Editor');
    console.log('\nCopy and run this SQL:\n');
    console.log(`
    ALTER TABLE public.pc_components
    ADD COLUMN IF NOT EXISTS motherboard_ram_type text;

    CREATE INDEX IF NOT EXISTS idx_pc_components_mb_ram_type
    ON public.pc_components(motherboard_ram_type)
    WHERE motherboard_ram_type IS NOT NULL;
    `);
    console.log('\nAfter running the SQL above, come back and run:');
    console.log('  node importSeeds-fast.mjs\n');
    process.exit(1);
  }

  console.log('✅ Database schema updated successfully');
  console.log('\n📊 Next step: Re-import seed data\n');
})();
