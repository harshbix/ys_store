import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runRecovery() {
  const email = 'yusuphshitambala@gmail.com';
  const password = 'Yusuph#2026';
  
  console.log('--- Step 1: Cleanup Corrupted User ---');
  const oldId = 'c4ed2faa-49f5-4b65-a2cc-c5032c497187';
  console.log('Attempting to delete the corrupted user by known old ID...');
  const { error: delErr1 } = await supabaseAdmin.auth.admin.deleteUser(oldId);
  if (delErr1) console.log('Delete by oldId resulted in:', delErr1.message);

  const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
  if (usersErr) {
    console.warn('Could not list users (corruption still present?):', usersErr.message);
  } else {
    let currentUser = usersData?.users?.find(u => u.email === email);
    if (currentUser) {
      console.log('Found existing user with ID', currentUser.id, '- deleting...');
      await supabaseAdmin.auth.admin.deleteUser(currentUser.id);
    }
  }

  console.log('\n--- Step 2: Creating new auth user ---');
  const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (createErr) {
    console.error('Failed to create user:', createErr);
    return;
  }

  const newId = createData.user.id;
  console.log('User successfully created! New Auth UUID:', newId);

  console.log('\n--- Step 3: Syncing public.admin_users ---');
  await supabaseAdmin.from('admin_users').delete().eq('email', email);
  
  const { data: adminSyncData, error: adminSyncErr } = await supabaseAdmin.from('admin_users').insert({
    id: newId,
    email: email,
    full_name: 'Yusuph Shitambala',
    role: 'owner',
    is_active: true
  }).select().single();

  if (adminSyncErr) {
    console.error('Error syncing admin row:', adminSyncErr);
  } else {
    console.log('public.admin_users synced successfully. ID matches:', adminSyncData.id === newId, '| Role:', adminSyncData.role);
  }

  console.log('\n--- Step 4: Testing Login ---');
  const { data: loginData, error: loginErr } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (loginErr) {
    console.error('Login failed:', loginErr.message);
  } else {
    console.log('Login succeeded! Access Token received. Logged in UUID matches new admin?', loginData.user.id === newId);
  }
}

runRecovery().catch(console.error);
