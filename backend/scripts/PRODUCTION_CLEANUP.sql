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
  -- 1. IDENTIFY OR CREATE ADMIN ACCOUNT
  ---------------------------------------------------------
  SELECT id INTO target_admin_id FROM auth.users WHERE email = target_admin_email;
  
  IF target_admin_id IS NULL THEN
    target_admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      target_admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      target_admin_email,
      target_admin_password_hash,
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{}'::jsonb,
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      target_admin_id,
      jsonb_build_object('sub', target_admin_id::text, 'email', target_admin_email),
      'email',
      target_admin_email,
      now(),
      now(),
      now()
    );
  ELSE
    UPDATE auth.users 
    SET 
      encrypted_password = target_admin_password_hash, 
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      role = 'authenticated',
      updated_at = now()
    WHERE id = target_admin_id;
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
  -- 5. REMOVE ALL OTHER USERS AND ADMINS
  ---------------------------------------------------------
  -- Remove secondary admin users to prevent login bypass
  DELETE FROM public.admin_users WHERE id != target_admin_id;
  
  -- Remove secondary auth users
  DELETE FROM auth.users WHERE id != target_admin_id;
  
  -- Note: We INTENTIONALLY PRESERVE `spec_definitions` and `compatibility_rules` 
  -- because these are core structural rule configurations required to upload laptops/desktops smoothly.
  
  ---------------------------------------------------------
  -- END TRANSACTION
  ---------------------------------------------------------
END $$;
