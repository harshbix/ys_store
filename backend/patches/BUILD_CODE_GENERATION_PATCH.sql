-- BUILD_CODE_GENERATION_PATCH.sql
-- Fix missing build_code generation in create_or_get_custom_build
-- Issue: Error 23502 - null value in column "build_code" violates not-null constraint
-- Root cause: INSERT omits build_code, which is NOT NULL unique and has no default
--
-- Copy/paste to Supabase SQL Editor and click Run

CREATE OR REPLACE FUNCTION create_or_get_custom_build(
  p_customer_auth_id uuid DEFAULT NULL,
  p_session_token text DEFAULT NULL,
  p_name text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  build_code text,
  owner_type text,
  name text,
  build_status text,
  compatibility_status text,
  total_estimated_price_tzs bigint,
  created_at timestamptz
) AS $$
DECLARE
  v_build_id uuid;
  v_build_code text;
  v_owner_type build_owner_type;
BEGIN
  -- Determine owner type
  v_owner_type := CASE
    WHEN p_customer_auth_id IS NOT NULL THEN 'customer'::build_owner_type
    ELSE 'guest'::build_owner_type
  END;

  -- Try to find existing draft build
  IF p_customer_auth_id IS NOT NULL THEN
    SELECT b.id INTO v_build_id
    FROM custom_builds b
    WHERE b.customer_auth_id = p_customer_auth_id
      AND b.build_status = 'draft'
    LIMIT 1;
  ELSE
    SELECT b.id INTO v_build_id
    FROM custom_builds b
    WHERE b.session_token = p_session_token
      AND b.build_status = 'draft'
    LIMIT 1;
  END IF;

  -- If exists, return it
  IF v_build_id IS NOT NULL THEN
    RETURN QUERY
    SELECT b.id, b.build_code, b.owner_type::text, b.name, b.build_status::text, b.compatibility_status::text, b.total_estimated_price_tzs, b.created_at
    FROM custom_builds b
    WHERE b.id = v_build_id;
    RETURN;
  END IF;

  -- Generate unique build_code before insert
  v_build_code := 'BUILD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYMMDDHH24MI') || '-' || LPAD((RANDOM() * 9999)::int::text, 4, '0');

  -- Create new build
  INSERT INTO custom_builds (
    customer_auth_id,
    session_token,
    owner_type,
    name,
    build_status,
    compatibility_status,
    total_estimated_price_tzs,
    build_code
  ) VALUES (
    p_customer_auth_id,
    p_session_token,
    v_owner_type,
    COALESCE(p_name, 'My Custom Build'),
    'draft'::build_status,
    'warning'::compatibility_status,
    0,
    v_build_code
  ) RETURNING custom_builds.id INTO v_build_id;

  -- Return newly created build
  RETURN QUERY
  SELECT b.id, b.build_code, b.owner_type::text, b.name, b.build_status::text, b.compatibility_status::text, b.total_estimated_price_tzs, b.created_at
  FROM custom_builds b
  WHERE b.id = v_build_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification: Run separately
-- SELECT * FROM create_or_get_custom_build(p_session_token := 'test-build-verification');
