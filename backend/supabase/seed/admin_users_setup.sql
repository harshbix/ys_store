-- backend/supabase/seed/admin_users.sql
-- Seed script for admin_users
-- This sets up the initial admin users. Password hashes must be generated via Node script.

-- Make sure the two admin accounts exist in the table
-- Their password_hash values should be populated using the generate-admin-hashes.mjs script

INSERT INTO admin_users (id, email, full_name, role, is_active, auth_method)
VALUES 
  (gen_random_uuid(), 'kidabixson@gmail.com', 'Admin User 1', 'owner', true, 'password'),
  (gen_random_uuid(), 'yusuphshitambala@gmail.com', 'Admin User 2', 'admin', true, 'password')
ON CONFLICT (email) DO UPDATE 
SET auth_method = 'password', is_active = true, role = EXCLUDED.role
WHERE admin_users.auth_method IS NULL OR admin_users.auth_method != 'password';
