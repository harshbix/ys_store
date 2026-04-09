import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function updateAdminPassword() {
  const email = 'yusuphshitambala@gmail.com';
  const passwordHash = 'b6B7sCRgkYrTM8C1mmLor7ry+Kx68TvC7zBM212OJTA+mFCEwJHdGRGcMQMIlEinQXBfMdTme4i8Pa4mhIYK5Ggpw0sdVRFkVSH3i34J1ZGfhiyXZ/X5GX6BEh6TtT2I';

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .update({ password_hash: passwordHash })
      .eq('email', email)
      .select();

    if (error) {
      console.error('Error updating password:', error.message);
      process.exit(1);
    }

    console.log('✓ Admin password updated successfully!');
    console.log('Email:', email);
    console.log('Password: 12345678');
    console.log('Updated record:', data);
  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

updateAdminPassword();
