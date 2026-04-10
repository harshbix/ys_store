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

console.log('🔧 Adding motherboard_ram_type column...\n');

// Try to add the column (if it doesn't exist, this will just fail silently in Supabase)
// Since we can't run raw SQL, we'll use a workaround: try to insert with that column
// and if it fails, we know we need to do it manually

try {
  const { error: testError } = await supabase
    .from('pc_components')
    .insert([
      {
        id: '_test_column_check',
        type: 'test',
        name: 'test',
        price_tzs: 0,
        motherboard_ram_type: 'DDR5'
      }
    ]);

  if (testError?.message?.includes('motherboard_ram_type')) {
    console.log('⚠️ Column does not exist in database.\n');
    console.log('Create the column manually via Supabase SQL Editor:\n');
    console.log('ALTER TABLE public.pc_components ADD COLUMN motherboard_ram_type text;\n');
    console.log('Then run: node custom-builds/importSeeds-fast.mjs\n');
  } else {
    // Column exists, delete test record
    await supabase
      .from('pc_components')
      .delete()
      .eq('id', '_test_column_check');
    
    console.log('✅ Column already exists');
  }
} catch (err) {
  console.error('Error:', err.message);
}
