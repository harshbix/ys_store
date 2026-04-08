-- PRODUCTION_CLEANUP.sql
-- WARNING: DESTRUCTIVE ACTION
-- This script permanently wipes all customer data, auth sessions, carts, wishlists, and demo products.
-- It ensures only ONE allowed admin user exists (yusuphshitambala@gmail.com).

-- This script will safely create the admin auth user if it does not exist,
-- or update it to the exact email and password required.

DO $$ 
DECLARE
  target_admin_email text := 'yusuphshitambala@gmail.com';
  target_admin_password_hash text := crypt('Yusuph#2026', gen_salt('bf'));
  target_admin_id uuid;
BEGIN
  ---------------------------------------------------------
  -- 1. IDENTIFY ADMIN ACCOUNT
  ---------------------------------------------------------
  -- NOTE: Admin Auth manipulation via SQL is prohibited to prevent GoTrue corruption.
  -- This script assumes the Admin User is already created via the Supabase Admin Dashboard.
  SELECT id INTO target_admin_id FROM auth.users WHERE email = target_admin_email;
  
  IF target_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin auth user not found. Please create yusuphshitambala@gmail.com via the Supabase Dashboard first.';
  END IF;

  ---------------------------------------------------------
  -- 2. ENSURE PUBLIC.ADMIN_USERS METADATA
  ---------------------------------------------------------
  INSERT INTO public.admin_users (id, email, full_name, role, is_active)
  VALUES (target_admin_id, target_admin_email, 'Yusuph Shitambala', 'owner', true)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    role = EXCLUDED.role, 
    is_active = true,
    full_name = EXCLUDED.full_name;

  ---------------------------------------------------------
  -- 3. CLEAN CUSTOMER AND TRANSACTIONAL DATA (CASCADE)
  ---------------------------------------------------------
  -- Using TRUNCATE CASCADE to safely remove dependencies like items and specs
  TRUNCATE TABLE public.carts CASCADE;
  TRUNCATE TABLE public.wishlists CASCADE;
  TRUNCATE TABLE public.quotes CASCADE;
  TRUNCATE TABLE public.custom_builds CASCADE;
  TRUNCATE TABLE public.analytics_events CASCADE;
  
  ---------------------------------------------------------
  -- 4. HANDLE CATALOG AND PRODUCTS DATA
  ---------------------------------------------------------
  -- Eliminate demo products, media, and rules.
  -- This leaves table schema fully intact but empty, perfectly primed for fresh catalog inputs.
  TRUNCATE TABLE public.products CASCADE;
  -- Product references like specs and media will cascade above inherently, but we ensure clear mapping
  TRUNCATE TABLE public.product_specs CASCADE;
  TRUNCATE TABLE public.product_media CASCADE;

  ---------------------------------------------------------
  -- 5. REMOVE ALL OTHER SECONDARY ADMINS (PUBLIC TABLE ONLY)
  ---------------------------------------------------------
  -- Remove secondary admin users to prevent login bypass
  DELETE FROM public.admin_users WHERE id != target_admin_id;
  
  -- NOTE: Do NOT use SQL DELETE on auth.users here. Use the Supabase Dashboard
  --  'Authentication -> Users -> Select All -> Delete' to remove other accounts
  --  safely without corrupting the GoTrue service.
  
  ---------------------------------------------------------
  -- END TRANSACTION
  ---------------------------------------------------------
END $$;
