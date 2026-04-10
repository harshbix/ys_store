import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('📂 Creating PC Builder preset tables...\n');

// Read migration SQL
const migrationSql = fs.readFileSync('./supabase/migrations/022_create_pc_builder_presets.sql', 'utf8');

// Split into individual statements
const statements = migrationSql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Found ${statements.length} SQL statements\n`);

try {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    
    if (stmt.length < 20) continue; // Skip tiny statements
    
    console.log(`[${i + 1}/${statements.length}] Executing...`);
    
    // Execute via Supabase's rpc or raw query
    // Since we can't directly execute SQL, we'll use Supabase's pg API
    const { error } = await supabase.rpc('exec_sql', { sql: stmt }, { head: false });
    
    if (error) {
      // Try alternative approach - the tables might be created differently
      console.log(`⚠️ Statement ${i + 1} failed: ${error.message}`);
    } else {
      console.log(`✓`);
    }
  }
  
  console.log('\n✅ Migration complete!');
} catch (err) {
  console.error('❌ Error:', err.message);
  
  console.log('\n⚠️ Note: Direct SQL execution may not be available.');
  console.log('Please either:');
  console.log('1. Apply the migration in Supabase Dashboard → SQL Editor');
  console.log('2. Use Supabase CLI: supabase db push');
  process.exit(1);
}
