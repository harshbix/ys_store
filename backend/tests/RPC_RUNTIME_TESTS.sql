-- RPC RUNTIME VALIDATION TEST SUITE
-- Execute each test in Supabase SQL Editor after migrations are deployed
-- Expected: All tests should execute without errors and return expected data types

-- ============================================================================
-- TEST 1: CART FLOW - get_or_create_customer_cart
-- ============================================================================
-- Test: Create new guest cart
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM get_or_create_customer_cart(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: get_or_create_customer_cart returned NULL';
  END IF;
  
  IF v_result.id IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: cart id is NULL';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Created cart % for session %', v_result.id, v_session_token;
END $$;

-- ============================================================================
-- TEST 2: CART FLOW - add_item_to_cart
-- ============================================================================
-- Test: Add product to cart
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_cart_id uuid;
  v_product_id uuid;
  v_result RECORD;
BEGIN
  -- Get a product to add
  SELECT id INTO v_product_id FROM products LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'TEST SKIPPED: No products in database';
  END IF;
  
  -- Create cart
  SELECT id INTO v_cart_id FROM get_or_create_customer_cart(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  -- Add item
  SELECT * INTO v_result FROM add_item_to_cart(
    p_cart_id => v_cart_id,
    p_item_type => 'product',
    p_product_id => v_product_id,
    p_quantity => 1
  );
  
  IF v_result.estimated_total_tzs <= 0 THEN
    RAISE EXCEPTION 'TEST FAILED: total should be > 0';
  END IF;
  
  IF v_result.items IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: items is NULL';
  END IF;
  
  IF jsonb_array_length(v_result.items::jsonb) != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: Should have 1 item in cart';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Added item to cart, total: %', v_result.estimated_total_tzs;
END $$;

-- ============================================================================
-- TEST 3: CART FLOW - Duplicate item detection
-- ============================================================================
-- Test: Adding same item twice should increase quantity, not duplicate
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_cart_id uuid;
  v_product_id uuid;
  v_result_1 RECORD;
  v_result_2 RECORD;
BEGIN
  SELECT id INTO v_product_id FROM products LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'TEST SKIPPED: No products in database';
  END IF;
  
  SELECT id INTO v_cart_id FROM get_or_create_customer_cart(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  -- Add same item twice
  SELECT * INTO v_result_1 FROM add_item_to_cart(
    p_cart_id => v_cart_id,
    p_item_type => 'product',
    p_product_id => v_product_id,
    p_quantity => 1
  );
  
  SELECT * INTO v_result_2 FROM add_item_to_cart(
    p_cart_id => v_cart_id,
    p_item_type => 'product',
    p_product_id => v_product_id,
    p_quantity => 1
  );
  
  -- Should still have only 1 item (not 2)
  IF v_result_2.items IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: items is NULL after duplicate add';
  END IF;
  
  IF jsonb_array_length(v_result_2.items::jsonb) != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: Should have 1 item after duplicate add';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Duplicate detection works, items: %', jsonb_array_length(v_result_2.items::jsonb);
END $$;

-- ============================================================================
-- TEST 4: BUILD FLOW - create_or_get_custom_build
-- ============================================================================
-- Test: Create custom build 
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM create_or_get_custom_build(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token,
    p_name => 'Test Build'
  );
  
  IF v_result.id IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: build id is NULL';
  END IF;
  
  IF v_result.build_code IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: build_code is NULL';
  END IF;
  
  IF v_result.total_estimated_price_tzs != 0 THEN
    RAISE EXCEPTION 'TEST FAILED: new build should have 0 total';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Created build % with code %', v_result.id, v_result.build_code;
END $$;

-- ============================================================================
-- TEST 5: BUILD FLOW - upsert_custom_build_item
-- ============================================================================
-- Test: Add CPU component to build
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_build_id uuid;
  v_product_id uuid;
  v_result RECORD;
BEGIN
  -- Get a product
  SELECT id INTO v_product_id FROM products WHERE product_type = 'component' LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'TEST SKIPPED: No component products in database';
  END IF;
  
  -- Create build
  SELECT id INTO v_build_id FROM create_or_get_custom_build(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  -- Add CPU
  SELECT * INTO v_result FROM upsert_custom_build_item(
    p_build_id => v_build_id,
    p_component_type => 'cpu',
    p_product_id => v_product_id
  );
  
  IF v_result.total_estimated_price_tzs <= 0 THEN
    RAISE EXCEPTION 'TEST FAILED: total should be > 0 after adding item';
  END IF;
  
  IF v_result.items IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: items is NULL after adding component';
  END IF;
  
  IF jsonb_array_length(v_result.items::jsonb) != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: Should have 1 component';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Added CPU component, total: %', v_result.total_estimated_price_tzs;
END $$;

-- ============================================================================
-- TEST 6: BUILD FLOW - validate_custom_build
-- ============================================================================
-- Test: Validation should warn about missing required components
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_build_id uuid;
  v_result RECORD;
BEGIN
  -- Create empty build
  SELECT id INTO v_build_id FROM create_or_get_custom_build(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  -- Validate (should have warnings)
  SELECT * INTO v_result FROM validate_custom_build(v_build_id);
  
  IF v_result.is_valid != false THEN
    RAISE EXCEPTION 'TEST FAILED: Empty build should be invalid';
  END IF;
  
  IF v_result.missing_components IS NULL OR array_length(v_result.missing_components, 1) = 0 THEN
    RAISE EXCEPTION 'TEST FAILED: should list missing components';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Validation detected missing: %', v_result.missing_components;
END $$;

-- ============================================================================
-- TEST 7: QUOTE FLOW - create_quote_from_cart (Idempotency)
-- ============================================================================
-- Test: Same idempotency key should return same quote
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_cart_id uuid;
  v_product_id uuid;
  v_idempotency_key text := gen_random_uuid()::text;
  v_result_1 RECORD;
  v_result_2 RECORD;
BEGIN
  SELECT id INTO v_product_id FROM products LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'TEST SKIPPED: No products in database';
  END IF;
  
  -- Create and populate cart
  SELECT id INTO v_cart_id FROM get_or_create_customer_cart(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  PERFORM add_item_to_cart(
    p_cart_id => v_cart_id,
    p_item_type => 'product',
    p_product_id => v_product_id,
    p_quantity => 1
  );
  
  -- Create quote first time - SELECT * INTO to capture full result packet
  SELECT * INTO v_result_1 FROM create_quote_from_cart(
    p_customer_name => 'Test Customer',
    p_notes => 'Test quote',
    p_source_type => 'cart',
    p_source_id => v_cart_id,
    p_idempotency_key => v_idempotency_key
  );
  
  IF v_result_1 IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: First create_quote_from_cart returned NULL';
  END IF;
  
  -- Create quote second time with same key
  SELECT * INTO v_result_2 FROM create_quote_from_cart(
    p_customer_name => 'Test Customer',
    p_notes => 'Test quote',
    p_source_type => 'cart',
    p_source_id => v_cart_id,
    p_idempotency_key => v_idempotency_key
  );
  
  IF v_result_2 IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: Second create_quote_from_cart returned NULL';
  END IF;
  
  -- Should be the SAME quote
  IF v_result_1.id != v_result_2.id THEN
    RAISE EXCEPTION 'TEST FAILED: Same idempotency key should return same quote';
  END IF;
  
  IF v_result_1.quote_code != v_result_2.quote_code THEN
    RAISE EXCEPTION 'TEST FAILED: Quote codes should match';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Idempotency works, created quote % once', v_result_1.quote_code;
END $$;

-- ============================================================================
-- TEST 8: QUOTE FLOW - get_quote_with_items
-- ============================================================================
-- Test: Quote retrieval with items
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_cart_id uuid;
  v_product_id uuid;
  v_quote_code text;
  v_quote_result RECORD;
  v_result RECORD;
BEGIN
  SELECT id INTO v_product_id FROM products LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'TEST SKIPPED: No products in database';
  END IF;
  
  -- Create and populate cart
  SELECT id INTO v_cart_id FROM get_or_create_customer_cart(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  PERFORM add_item_to_cart(
    p_cart_id => v_cart_id,
    p_item_type => 'product',
    p_product_id => v_product_id,
    p_quantity => 2
  );
  
  -- Create quote - SELECT * INTO to safely extract quote_code
  SELECT * INTO v_quote_result FROM create_quote_from_cart(
    p_customer_name => 'Test Customer',
    p_source_type => 'cart',
    p_source_id => v_cart_id
  );
  
  IF v_quote_result IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: create_quote_from_cart returned NULL';
  END IF;
  
  v_quote_code := v_quote_result.quote_code;
  
  IF v_quote_code IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: quote_code is NULL';
  END IF;
  
  -- Retrieve quote
  SELECT * INTO v_result FROM get_quote_with_items(v_quote_code);
  
  IF v_result.id IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: Could not retrieve quote';
  END IF;
  
  IF jsonb_array_length(v_result.items::jsonb) != 1 THEN
    RAISE EXCEPTION 'TEST FAILED: Quote should have 1 item';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Retrieved quote % with % items', v_result.quote_code, jsonb_array_length(v_result.items::jsonb);
END $$;

-- ============================================================================
-- TEST 9: QUOTE FLOW - track_quote_whatsapp_click
-- ============================================================================
-- Test: WhatsApp click tracking
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_cart_id uuid;
  v_product_id uuid;
  v_quote_code text;
  v_quote_result RECORD;
  v_result_before RECORD;
  v_result_after RECORD;
BEGIN
  SELECT id INTO v_product_id FROM products LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'TEST SKIPPED: No products in database';
  END IF;
  
  -- Create and populate cart
  SELECT id INTO v_cart_id FROM get_or_create_customer_cart(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  PERFORM add_item_to_cart(
    p_cart_id => v_cart_id,
    p_item_type => 'product',
    p_product_id => v_product_id,
    p_quantity => 1
  );
  
  -- Create quote - SELECT * INTO to safely extract quote_code
  SELECT * INTO v_quote_result FROM create_quote_from_cart(
    p_customer_name => 'Test Customer',
    p_source_type => 'cart',
    p_source_id => v_cart_id
  );
  
  IF v_quote_result IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: create_quote_from_cart returned NULL';
  END IF;
  
  v_quote_code := v_quote_result.quote_code;
  
  IF v_quote_code IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: quote_code is NULL';
  END IF;
  
  -- Check before
  SELECT * INTO v_result_before FROM get_quote_with_items(v_quote_code);
  
  IF v_result_before.whatsapp_clicked_at IS NOT NULL THEN
    RAISE EXCEPTION 'TEST FAILED: Click should not be set initially';
  END IF;
  
  -- Track click
  SELECT * INTO v_result_after FROM track_quote_whatsapp_click(v_quote_code);
  
  IF v_result_after.whatsapp_clicked_at IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: Click timestamp not set after tracking';
  END IF;
  
  RAISE NOTICE 'TEST PASSED: WhatsApp click tracked at %', v_result_after.whatsapp_clicked_at;
END $$;

-- ============================================================================
-- TEST 10: TOTALS RECALCULATION
-- ============================================================================
-- Test: Totals recalculate correctly after add/remove
DO $$
DECLARE
  v_session_token text := gen_random_uuid()::text;
  v_cart_id uuid;
  v_product_id uuid;
  v_product_price bigint;
  v_result_1 RECORD;
  v_result_2 RECORD;
  v_result_3 RECORD;
BEGIN
  SELECT id, estimated_price_tzs INTO v_product_id, v_product_price FROM products LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'TEST SKIPPED: No products in database';
  END IF;
  
  -- Create cart
  SELECT id INTO v_cart_id FROM get_or_create_customer_cart(
    p_customer_auth_id => NULL,
    p_session_token => v_session_token
  );
  
  -- Add 1 item
  SELECT * INTO v_result_1 FROM add_item_to_cart(
    p_cart_id => v_cart_id,
    p_item_type => 'product',
    p_product_id => v_product_id,
    p_quantity => 1
  );
  
  -- Add same item again (quantity should be 2)
  SELECT * INTO v_result_2 FROM add_item_to_cart(
    p_cart_id => v_cart_id,
    p_item_type => 'product',
    p_product_id => v_product_id,
    p_quantity => 1
  );
  
  -- Verify items before extraction
  IF v_result_2.items IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: items is NULL before quantity update';
  END IF;
  
  -- Extract item id using correct JSON path: ->0 gets first array element, ->>'id' extracts id as text
  -- Update quantity to 3
  SELECT * INTO v_result_3 FROM update_cart_item_quantity(
    p_cart_id => v_cart_id,
    p_item_id => (v_result_2.items::jsonb->0->>'id')::uuid,
    p_quantity => 3
  );
  
  IF v_result_3 IS NULL THEN
    RAISE EXCEPTION 'TEST FAILED: update_cart_item_quantity returned NULL';
  END IF;
  
  -- Verify totals
  IF v_result_1.estimated_total_tzs != v_product_price THEN
    RAISE EXCEPTION 'TEST FAILED: First total should be %', v_product_price;
  END IF;
  
  IF v_result_3.estimated_total_tzs != (v_product_price * 3) THEN
    RAISE EXCEPTION 'TEST FAILED: Third total should be % * 3 = %', v_product_price, v_product_price * 3;
  END IF;
  
  RAISE NOTICE 'TEST PASSED: Totals recalculated correctly: % -> % -> %', 
    v_result_1.estimated_total_tzs, 
    v_result_2.estimated_total_tzs,
    v_result_3.estimated_total_tzs;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- If all tests above completed without exceptions, the RPC layer is working correctly!
-- Remaining runtime validation:
-- - [ ] RLS prevents unauthorized access (test with different sessions/auth)
-- - [ ] Frontend pages render without errors
-- - [ ] No console errors in browser

RAISE NOTICE '✓ All SQL RPC tests completed successfully!';
