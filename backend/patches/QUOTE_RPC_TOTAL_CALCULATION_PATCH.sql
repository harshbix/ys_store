-- QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql
-- Fix missing column reference in create_quote_from_cart
-- Issue: Error 42703 - column c.total_estimated_price_tzs does not exist
-- Root cause: carts table has no total_estimated_price_tzs column; total must be computed from cart_items
--
-- Copy/paste to Supabase SQL Editor and click Run

CREATE OR REPLACE FUNCTION create_quote_from_cart(
  p_customer_name text,
  p_notes text DEFAULT NULL,
  p_source_type text DEFAULT 'cart',
  p_source_id uuid DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  quote_code text,
  status text,
  customer_name text,
  estimated_total_tzs bigint,
  idempotency_key text,
  created_at timestamptz
) AS $$
DECLARE
  v_quote_id uuid;
  v_quote_code text;
  v_total_tzs bigint;
  v_items_json json;
BEGIN
  -- Validate inputs
  IF p_customer_name IS NULL OR p_customer_name = '' THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;

  IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
    p_idempotency_key := gen_random_uuid()::text;
  END IF;

  -- Check if quote with this idempotency key already exists
  SELECT q.id INTO v_quote_id
  FROM quotes q
  WHERE q.idempotency_key = p_idempotency_key;

  IF v_quote_id IS NOT NULL THEN
    -- Return existing quote
    RETURN QUERY
    SELECT q.id, q.quote_code, q.status::text, q.customer_name, q.estimated_total_tzs, q.idempotency_key, q.created_at
    FROM quotes q
    WHERE q.id = v_quote_id;
    RETURN;
  END IF;

  -- Get cart total (computed from items) and items JSON
  IF p_source_type = 'cart' AND p_source_id IS NOT NULL THEN
    SELECT COALESCE(SUM(ci.unit_estimated_price_tzs * ci.quantity), 0)::bigint,
           COALESCE(
             json_agg(
               json_build_object(
                 'item_type', ci.item_type::text,
                 'product_id', ci.product_id,
                 'custom_build_id', ci.custom_build_id,
                 'title_snapshot', ci.title_snapshot,
                 'specs_snapshot', ci.specs_snapshot,
                 'quantity', ci.quantity,
                 'unit_estimated_price_tzs', ci.unit_estimated_price_tzs,
                 'line_total_tzs', ci.quantity * ci.unit_estimated_price_tzs
               ) ORDER BY ci.created_at
             ),
             '[]'::json
           )
    INTO v_total_tzs, v_items_json
    FROM carts c
    LEFT JOIN cart_items ci ON c.id = ci.cart_id
    WHERE c.id = p_source_id
    GROUP BY c.id;

    IF v_total_tzs IS NULL THEN
      RAISE EXCEPTION 'Cart not found';
    END IF;
  ELSE
    RAISE EXCEPTION 'Only cart source is currently supported';
  END IF;

  -- Generate quote code
  v_quote_code := 'QT-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYMMDDHH24MI') || '-' || LPAD((RANDOM() * 9999)::int::text, 4, '0');

  -- Create quote
  INSERT INTO quotes (
    quote_code,
    quote_type,
    status,
    customer_name,
    notes,
    estimated_total_tzs,
    source_cart_id,
    idempotency_key,
    whatsapp_message,
    whatsapp_clicked_at
  ) VALUES (
    v_quote_code,
    'general'::quote_type,
    'new'::quote_status,
    p_customer_name,
    p_notes,
    v_total_tzs,
    CASE WHEN p_source_type = 'cart' THEN p_source_id ELSE NULL END,
    p_idempotency_key,
    'Quote ' || v_quote_code,
    NULL
  ) RETURNING quotes.id INTO v_quote_id;

  -- Insert quote items from cart items
  IF p_source_type = 'cart' AND p_source_id IS NOT NULL THEN
    INSERT INTO quote_items (quote_id, item_type, ref_product_id, ref_custom_build_id, title_snapshot, specs_snapshot, quantity, unit_estimated_price_tzs)
    SELECT
      v_quote_id,
      ci.item_type,
      ci.product_id,
      ci.custom_build_id,
      ci.title_snapshot,
      ci.specs_snapshot,
      ci.quantity,
      ci.unit_estimated_price_tzs
    FROM cart_items ci
    WHERE ci.cart_id = p_source_id;
  END IF;

  -- Return created quote
  RETURN QUERY
  SELECT q.id, q.quote_code, q.status::text, q.customer_name, q.estimated_total_tzs, q.idempotency_key, q.created_at
  FROM quotes q
  WHERE q.id = v_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification: Run separately
-- SELECT * FROM create_quote_from_cart('Test Customer', p_idempotency_key := gen_random_uuid()::text);
