-- 020_fix_quote_rpc_missing_quote_type.sql
-- Fixes "null value in column quote_type of relation quotes violates not-null constraint"
-- The quotes table requires quote_type, so we default it to 'general' for cart-based quotes.

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
  IF p_customer_name IS NULL OR p_customer_name = '' THEN
    RAISE EXCEPTION 'customer_name is required';
  END IF;

  IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
    p_idempotency_key := gen_random_uuid()::text;
  END IF;

  SELECT q.id INTO v_quote_id
  FROM quotes q
  WHERE q.idempotency_key = p_idempotency_key;

  IF v_quote_id IS NOT NULL THEN
    RETURN QUERY
    SELECT q.id, q.quote_code, q.status::text, q.customer_name, q.estimated_total_tzs, q.idempotency_key, q.created_at
    FROM quotes q
    WHERE q.id = v_quote_id;
    RETURN;
  END IF;

  IF p_source_type = 'cart' AND p_source_id IS NOT NULL THEN
    SELECT
      COALESCE(
        (
          SELECT SUM(COALESCE(ci.quantity, 0) * COALESCE(ci.unit_estimated_price_tzs, 0))
          FROM cart_items ci
          WHERE ci.cart_id = c.id
        ),
        0
      )::bigint,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'item_type', ci.item_type::text,
              'product_id', ci.product_id,
              'custom_build_id', ci.custom_build_id,
              'title_snapshot', ci.title_snapshot,
              'specs_snapshot', ci.specs_snapshot,
              'quantity', ci.quantity,
              'unit_estimated_price_tzs', ci.unit_estimated_price_tzs,
              'line_total_tzs', COALESCE(ci.quantity, 0) * COALESCE(ci.unit_estimated_price_tzs, 0)
            ) ORDER BY ci.created_at
          )
          FROM cart_items ci
          WHERE ci.cart_id = c.id
        ),
        '[]'::json
      )
    INTO v_total_tzs, v_items_json
    FROM carts c
    WHERE c.id = p_source_id
    LIMIT 1;

    IF v_total_tzs IS NULL THEN
      RAISE EXCEPTION 'Cart not found';
    END IF;

    IF COALESCE(json_array_length(v_items_json), 0) = 0 THEN
      RAISE EXCEPTION USING
        MESSAGE = 'Cart is empty',
        DETAIL = 'create_quote_from_cart requires at least one cart item',
        HINT = 'Add items to the cart before creating a quote';
    END IF;
  ELSE
    RAISE EXCEPTION 'Only cart source is currently supported';
  END IF;

  v_quote_code := 'QT-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYMMDDHH24MI') || '-' || LPAD((RANDOM() * 9999)::int::text, 4, '0');

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

  INSERT INTO quote_items (
    quote_id,
    item_type,
    ref_product_id,
    ref_custom_build_id,
    title_snapshot,
    specs_snapshot,
    quantity,
    unit_estimated_price_tzs,
    line_total_tzs
  )
  SELECT
    v_quote_id,
    ci.item_type,
    ci.product_id,
    ci.custom_build_id,
    ci.title_snapshot,
    ci.specs_snapshot,
    ci.quantity,
    ci.unit_estimated_price_tzs,
    COALESCE(ci.quantity, 0) * COALESCE(ci.unit_estimated_price_tzs, 0)
  FROM cart_items ci
  WHERE ci.cart_id = p_source_id;

  RETURN QUERY
  SELECT q.id, q.quote_code, q.status::text, q.customer_name, q.estimated_total_tzs, q.idempotency_key, q.created_at
  FROM quotes q
  WHERE q.id = v_quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;