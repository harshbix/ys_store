-- 015_create_quote_creation_rpc.sql
-- RPC for idempotent quote creation

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

  -- Get cart total and items
  IF p_source_type = 'cart' AND p_source_id IS NOT NULL THEN
    SELECT c.total_estimated_price_tzs, 
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
    WHERE c.id = p_source_id;

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

-- Track quote WhatsApp click
CREATE OR REPLACE FUNCTION track_quote_whatsapp_click(
  p_quote_code text
)
RETURNS TABLE (
  id uuid,
  quote_code text,
  whatsapp_clicked_at timestamptz
) AS $$
BEGIN
  UPDATE quotes
  SET whatsapp_clicked_at = now(), updated_at = now()
  WHERE quote_code = p_quote_code;

  RETURN QUERY
  SELECT q.id, q.quote_code, q.whatsapp_clicked_at
  FROM quotes q
  WHERE q.quote_code = p_quote_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get quote by code with items
CREATE OR REPLACE FUNCTION get_quote_with_items(
  p_quote_code text
)
RETURNS TABLE (
  id uuid,
  quote_code text,
  status text,
  customer_name text,
  notes text,
  estimated_total_tzs bigint,
  idempotency_key text,
  whatsapp_clicked_at timestamptz,
  created_at timestamptz,
  items json
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.quote_code,
    q.status::text,
    q.customer_name,
    q.notes,
    q.estimated_total_tzs,
    q.idempotency_key,
    q.whatsapp_clicked_at,
    q.created_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', qi.id,
          'item_type', qi.item_type::text,
          'ref_product_id', qi.ref_product_id,
          'ref_custom_build_id', qi.ref_custom_build_id,
          'title_snapshot', qi.title_snapshot,
          'specs_snapshot', qi.specs_snapshot,
          'quantity', qi.quantity,
          'unit_estimated_price_tzs', qi.unit_estimated_price_tzs,
          'line_total_tzs', qi.quantity * qi.unit_estimated_price_tzs,
          'created_at', qi.created_at
        ) ORDER BY qi.created_at
      ),
      '[]'::json
    )
  FROM quotes q
  LEFT JOIN quote_items qi ON q.id = qi.quote_id
  WHERE q.quote_code = p_quote_code
  GROUP BY q.id, q.quote_code, q.status, q.customer_name, q.notes, q.estimated_total_tzs, q.idempotency_key, q.whatsapp_clicked_at, q.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
