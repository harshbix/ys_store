-- CART_RPC_ENUM_FIX.sql
-- Purpose: Fix enum-to-text casting for cart_status in cart RPC functions
-- Issue: Code 42804 - Return type mismatch: cart_status enum vs text
-- Affected: get_or_create_customer_cart, get_cart_with_items
-- 
-- ACTION: Copy/paste entire file to Supabase SQL Editor and click Run

CREATE OR REPLACE FUNCTION get_or_create_customer_cart(
  p_customer_auth_id uuid DEFAULT NULL,
  p_session_token text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  session_token text,
  customer_auth_id uuid,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  expires_at timestamptz
) AS $$
DECLARE
  v_cart_id uuid;
BEGIN
  -- Validate input: must have either customer_auth_id or session_token
  IF p_customer_auth_id IS NULL AND p_session_token IS NULL THEN
    RAISE EXCEPTION 'Either customer_auth_id or session_token must be provided';
  END IF;

  -- Try to find existing active cart
  IF p_customer_auth_id IS NOT NULL THEN
    SELECT c.id INTO v_cart_id
    FROM carts c
    WHERE c.customer_auth_id = p_customer_auth_id
      AND c.status = 'active'
    LIMIT 1;
  ELSE
    SELECT c.id INTO v_cart_id
    FROM carts c
    WHERE c.session_token = p_session_token
      AND c.status = 'active'
    LIMIT 1;
  END IF;

  -- If cart exists, return it
  IF v_cart_id IS NOT NULL THEN
    RETURN QUERY
    SELECT c.id, c.session_token, c.customer_auth_id, c.status::text, c.created_at, c.updated_at, c.expires_at
    FROM carts c
    WHERE c.id = v_cart_id;
    RETURN;
  END IF;

  -- Create new cart
  INSERT INTO carts (customer_auth_id, session_token, status)
  VALUES (p_customer_auth_id, p_session_token, 'active')
  RETURNING carts.id INTO v_cart_id;

  -- Return newly created cart
  RETURN QUERY
  SELECT c.id, c.session_token, c.customer_auth_id, c.status::text, c.created_at, c.updated_at, c.expires_at
  FROM carts c
  WHERE c.id = v_cart_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_cart_with_items(
  p_cart_id uuid
)
RETURNS TABLE (
  cart_id uuid,
  session_token text,
  customer_auth_id uuid,
  status text,
  items json,
  estimated_total_tzs bigint,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.session_token,
    c.customer_auth_id,
    c.status::text,
    COALESCE(
      json_agg(
        json_build_object(
          'id', ci.id,
          'cart_id', ci.cart_id,
          'item_type', ci.item_type,
          'product_id', ci.product_id,
          'custom_build_id', ci.custom_build_id,
          'quantity', ci.quantity,
          'unit_estimated_price_tzs', ci.unit_estimated_price_tzs,
          'title_snapshot', ci.title_snapshot,
          'specs_snapshot', ci.specs_snapshot,
          'created_at', ci.created_at
        ) ORDER BY ci.created_at
      ),
      '[]'::json
    ) as items,
    COALESCE(SUM(ci.unit_estimated_price_tzs * ci.quantity), 0)::bigint,
    c.created_at,
    c.updated_at
  FROM carts c
  LEFT JOIN cart_items ci ON c.id = ci.cart_id
  WHERE c.id = p_cart_id
  GROUP BY c.id, c.session_token, c.customer_auth_id, c.status, c.created_at, c.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification: Run these queries separately after patch deployment
-- SELECT * FROM get_or_create_customer_cart('test-session-123');  -- Should return with status as text
-- SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_or_create_customer_cart', 'get_cart_with_items');  -- Should return 2
