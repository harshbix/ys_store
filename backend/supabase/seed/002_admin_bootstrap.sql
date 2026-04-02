-- 002_admin_bootstrap.sql
-- This creates admin profile metadata only. The auth user must already exist in Supabase Auth.
-- Replace :ADMIN_AUTH_USER_ID, :ADMIN_EMAIL, :ADMIN_FULL_NAME before execution.

insert into admin_users (id, email, full_name, role, is_active)
values (':ADMIN_AUTH_USER_ID'::uuid, ':ADMIN_EMAIL', ':ADMIN_FULL_NAME', 'owner', true)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = now();
