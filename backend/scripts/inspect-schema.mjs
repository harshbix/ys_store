import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('🔍 Checking Supabase schema...\n');

try {
  // Query information_schema to see what tables exist
  const { data, error } = await supabase.rpc('get_schema_info', {}, { 
    head: false 
  }).catch(() => null);

  // Alternative: try to list tables by attempting to query from information_schema  
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .catch(() => ({ data: null, error: 'Could not query information_schema' }));

  if (tables) {
    console.log('Existing tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
  } else {
    console.log('Could not enumerate tables. Tables should be created via Supabase SQL Editor.\n');
    console.log('📋 Steps to create tables:');
    console.log('1. Go to Supabase dashboard for project: kzpknqwlecicildibiqt');
    console.log('2. Click SQL Editor → New Query');
    console.log('3. Copy the entire contents of: backend/supabase/migrations/022_create_pc_builder_presets.sql');
    console.log('4. Paste into SQL Editor and click "Run"');
    console.log('5. Then run: npm run import:seeds\n');
  }
} catch (err) {
  console.error('Error:', err.message);
}
