import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runQueries() {
  console.log('\n--- Query 1: auth.users ---');
  const { data: authData, error: e1 } = await supabase.auth.admin.listUsers();
  if (e1) console.error('Error e1:', e1);
  const authUser = authData?.users?.find(u => u.email === 'yusuphshitambala@gmail.com');
  if (authUser) console.table([{ id: authUser.id, email: authUser.email, email_confirmed_at: authUser.email_confirmed_at, created_at: authUser.created_at, last_sign_in_at: authUser.last_sign_in_at }]);
  else console.log('No auth.users row found.');

  console.log('\n--- Query 2: public.admin_users ---');
  const { data: adminData } = await supabase.from('admin_users').select('id, email, role').eq('email', 'yusuphshitambala@gmail.com');
  if (adminData && adminData.length > 0) console.table(adminData);
  else console.log('No public.admin_users row found.');

  console.log('\n--- Query 3: Compare ---');
  const adminUser = adminData?.[0];
  if (authUser || adminUser) {
    console.table([{
      auth_user_id: authUser?.id, auth_email: authUser?.email, email_confirmed_at: authUser?.email_confirmed_at,
      admin_user_id: adminUser?.id, admin_email: adminUser?.email, admin_role: adminUser?.role
    }]);
  } else {
    console.log('No rows to compare.');
  }

  console.log('\n--- Query 4: Duplicates ---');
  const { data: allAdmins } = await supabase.from('admin_users').select('email');
  const counts = (allAdmins || []).reduce((acc, row) => { acc[row.email] = (acc[row.email] || 0) + 1; return acc; }, {});
  const dups = Object.entries(counts).filter(([e, c]) => c > 1).map(([email, total]) => ({ email, total }));
  if (dups.length > 0) console.table(dups);
  else console.log('No duplicates found in admin_users.');
}
runQueries().catch(console.error);
