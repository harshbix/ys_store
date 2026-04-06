-- 016_fix_cart_rpc_ambiguity.sql
-- Fix ambiguous column references in cart RPCs caused by RETURNS TABLE output column names.

CREATE OR REPLACE FUNCTION add_item_to_cart(
  p_cart_id uuid,
  p_item_type text,
  p_product_id uuid DEFAULT NULL,
  p_custom_build_id uuid DEFAULT NULL,
  p_quantity integer DEFAULT 1
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
DECLARE
  v_unit_price bigint;
  v_title text;
  v_existing_item_id uuid;
BEGIN
  IF p_item_type NOT IN ('product', 'custom_build') THEN
    RAISE EXCEPTION 'Invalid item_type: %', p_item_type;
  END IF;

  IF p_item_type = 'product' THEN
    IF p_product_id IS NULL THEN
      RAISE EXCEPTION 'product_id required for product items';
    END IF;

    SELECT p.estimated_price_tzs, p.title
    INTO v_unit_price, v_title
    FROM products p
    WHERE p.id = p_product_id;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
  ELSIF p_item_type = 'custom_build' THEN
    IF p_custom_build_id IS NULL THEN
      RAISE EXCEPTION 'custom_build_id required for custom_build items';
    END IF;

    SELECT cb.total_estimated_price_tzs, cb.name
    INTO v_unit_price, v_title
    FROM custom_builds cb
    WHERE cb.id = p_custom_build_id;

    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Custom build not found';
    END IF;
  END IF;

  SELECT ci.id
  INTO v_existing_item_id
  FROM cart_items ci
  WHERE ci.cart_id = p_cart_id
    AND ci.item_type = p_item_type
    AND (
      (p_item_type = 'product' AND ci.product_id = p_product_id) OR
      (p_item_type = 'custom_build' AND ci.custom_build_id = p_custom_build_id)
    )
  LIMIT 1;

  IF v_existing_item_id IS NOT NULL THEN
    UPDATE cart_items ci
    SET quantity = ci.quantity + p_quantity
    WHERE ci.id = v_existing_item_id;
  ELSE
    INSERT INTO cart_items (
      cart_id,
      item_type,
      product_id,
      custom_build_id,
      quantity,
      unit_estimated_price_tzs,
      title_snapshot
    ) VALUES (
      p_cart_id,
      p_item_type,
      p_product_id,
      p_custom_build_id,
      p_quantity,
      v_unit_price,
      v_title
    );
  END IF;

  RETURN QUERY SELECT * FROM get_cart_with_items(p_cart_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION remove_item_from_cart(
  p_cart_id uuid,
  p_item_id uuid
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
  DELETE FROM cart_items ci
  WHERE ci.id = p_item_id
    AND ci.cart_id = p_cart_id;

  RETURN QUERY SELECT * FROM get_cart_with_items(p_cart_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_cart_item_quantity(
  p_cart_id uuid,
  p_item_id uuid,
  p_quantity integer
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
  IF p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1';
  END IF;

  UPDATE cart_items ci
  SET quantity = p_quantity
  WHERE ci.id = p_item_id
    AND ci.cart_id = p_cart_id;

  RETURN QUERY SELECT * FROM get_cart_with_items(p_cart_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
