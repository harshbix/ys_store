-- VERIFICATION QUERIES FOR PATCHES
-- Run these separately in Supabase SQL Editor to verify each patch applied correctly

-- ============================================================================
-- After SEED_TEST_DATA.sql
-- ============================================================================
-- Should return 3 rows with correct product types (desktop, component, component)
SELECT sku, title, product_type, estimated_price_tzs
FROM products 
WHERE sku LIKE 'TST-%' OR sku LIKE 'RUNTIME-%'
ORDER BY sku;

-- ============================================================================
-- After BUILD_CODE_GENERATION_PATCH.sql
-- ============================================================================
-- Test that create_or_get_custom_build generates build_code (not NULL)
SELECT id, build_code, name, build_status 
FROM create_or_get_custom_build(p_session_token := 'verification-test-build-' || gen_random_uuid()::text);
-- Expected: build_code is NOT NULL (e.g., 'BUILD-260406xxxxx-yyyy'), status is 'draft'

-- ============================================================================
-- After QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql
-- ============================================================================
-- Test that create_quote_from_cart calculates total correctly (not NULL)
-- First create a cart, then create a quote from it
WITH new_cart AS (
  SELECT id FROM get_or_create_customer_cart(p_session_token := 'verify-quote-' || gen_random_uuid()::text)
)
SELECT id, quote_code, estimated_total_tzs
FROM create_quote_from_cart(
  'Verification Customer',
  p_source_id := (SELECT id FROM new_cart),
  p_idempotency_key := 'verify-' || gen_random_uuid()::text
);
-- Expected: estimated_total_tzs >= 0, quote_code like 'QT-xxxxx-yyyy'

-- ============================================================================
-- Quick Smoke Tests - All three should work without errors
-- ============================================================================

-- 1. Cart creation should work
SELECT id, status FROM get_or_create_customer_cart(p_session_token := 'verify-cart-' || gen_random_uuid()::text);

-- 2. Build creation should work
SELECT id, build_code, build_status FROM create_or_get_custom_build(p_session_token := 'verify-build-' || gen_random_uuid()::text);

-- 3. Quote creation should work (requires a cart)
WITH cart_for_quote AS (
  SELECT id FROM get_or_create_customer_cart(p_session_token := 'verify-quote-final-' || gen_random_uuid()::text)
)
SELECT id, quote_code, estimated_total_tzs FROM create_quote_from_cart(
  'Verification Test',
  p_source_id := (SELECT id FROM cart_for_quote),
  p_idempotency_key := 'verify-quote-' || gen_random_uuid()::text
);
