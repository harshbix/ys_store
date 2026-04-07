
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://kzpknqwlecicildibiqt.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGtucXdsZWNpY2lsZGliaXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEzODM3MywiZXhwIjoyMDkwNzE0MzczfQ.fDjS9VNxkxfQFpnD_rn7wkk1aE038pxIKmsdPvpB3WA');
async function run() {
  const { data } = await supabase.from('quotes').select('*').limit(1);
  console.log(data);
}
run();

