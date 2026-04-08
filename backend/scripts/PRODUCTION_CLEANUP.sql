-- PRODUCTION_CLEANUP.sql
-- WARNING: DESTRUCTIVE ACTION
-- This script permanently wipes all customer data, auth sessions, carts, wishlists, and demo products.
-- It ensures allowed admin users exist (yusuphshitambala@gmail.com, kidabixson@gmail.com).

-- This script will safely verify the admin auth users,
-- and update their roles.

DO $$ 
DECLARE
  target_admin1_email text := 'yusuphshitambala@gmail.com';
  target_admin2_email text := 'kidabixson@gmail.com';
  target_admin1_id uuid;
  target_admin2_id uuid;
BEGIN
  ---------------------------------------------------------
  -- 1. IDENTIFY ADMIN ACCOUNTS
  ---------------------------------------------------------
  -- NOTE: Admin Auth manipulation via SQL is prohibited to prevent GoTrue corruption.
  -- This script assumes the Admin Users are already created via the Supabase Admin Dashboard.
  SELECT id INTO target_admin1_id FROM auth.users WHERE email = target_admin1_email;
  SELECT id INTO target_admin2_id FROM auth.users WHERE email = target_admin2_email;
  
  IF target_admin1_id IS NULL THEN
    RAISE EXCEPTION 'Admin auth user not found. Please create yusuphshitambala@gmail.com via the Supabase Dashboard first.';
  END IF;

  ---------------------------------------------------------
  -- 2. ENSURE PUBLIC.ADMIN_USERS METADATA
  ---------------------------------------------------------
  -- Add admin 1
  INSERT INTO public.admin_users (id, email, full_name, role, is_active)
  VALUES (target_admin1_id, target_admin1_email, 'Yusuph Shitambala', 'owner', true)
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    role = EXCLUDED.role, 
    is_active = true,
    full_name = EXCLUDED.full_name;

  -- Add admin 2 if they exist in auth
  IF target_admin2_id IS NOT NULL THEN
    INSERT INTO public.admin_users (id, email, full_name, role, is_active)
    VALUES (target_admin2_id, target_admin2_email, 'Kidabixson', 'owner', true)
    ON CONFLICT (id) DO UPDATE SET 
      email = EXCLUDED.email, 
      role = EXCLUDED.role, 
      is_active = true,
      full_name = EXCLUDED.full_name;
  ELSE
    RAISE NOTICE 'Secondary admin (kidabixson@gmail.com) not found in auth.users, skipping.';
  END IF;

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
  DELETE FROM public.admin_users 
  WHERE id NOT IN (target_admin1_id) AND (target_admin2_id IS NULL OR id != target_admin2_id);
  
  -- NOTE: Do NOT use SQL DELETE on auth.users here. Use the Supabase Dashboard
  --  'Authentication -> Users -> Select All -> Delete' to remove other accounts
  --  safely without corrupting the GoTrue service.
  
  ---------------------------------------------------------
  -- END TRANSACTION
  ---------------------------------------------------------
END $$;
