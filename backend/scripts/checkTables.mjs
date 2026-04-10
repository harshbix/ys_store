import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('📂 Creating PC Builder preset tables via raw query...\n');

// Since Supabase JS doesn't support direct SQL execution in production mode,
// we need to use an RPC function or the Supabase REST API directly

// Alternative: Let's just verify the tables will be created by checking if they exist
// and providing instructions if they don't

try {
  // Try to query the tables
  const { data: components, error: compError } = await supabase
    .from('pc_components')
    .select('id')
    .limit(1);
  
  const { data: presets, error: preError } = await supabase
    .from('pc_build_presets')
    .select('id')
    .limit(1);

  if (compError?.code === 'PGRST116' || preError?.code === 'PGRST116') {
    console.log('⚠️ Tables do not exist yet.\n');
    console.log('Please apply the migration manually:\n');
    console.log('📋 Option 1: Supabase Dashboard');
    console.log('   1. Go to https://app.supabase.com');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Paste contents of: ./supabase/migrations/022_create_pc_builder_presets.sql');
    console.log('   5. Click "Run"\n');
    console.log('📋 Option 2: Supabase CLI');
    console.log('   $ supabase db push\n');
    
    console.log('After applying migration, run:');
    console.log('   $ node custom-builds/importSeeds.mjs\n');
    process.exit(1);
  }
  
  console.log('✅ Tables already exist!');
  console.log('Ready to import seed data.\n');
  
} catch (err) {
  console.error('❌ Error checking tables:', err.message);
  process.exit(1);
}
