-- 012_create_cart_management_rpc.sql
-- Safe cart get-or-create RPC that handles both authenticated and guest flows

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
    SELECT c.id, c.session_token, c.customer_auth_id, c.status, c.created_at, c.updated_at, c.expires_at
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
  SELECT c.id, c.session_token, c.customer_auth_id, c.status, c.created_at, c.updated_at, c.expires_at
  FROM carts c
  WHERE c.id = v_cart_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get cart with items
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
    c.status,
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

-- Add product to cart with validation
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
  -- Validate item type
  IF p_item_type NOT IN ('product', 'custom_build') THEN
    RAISE EXCEPTION 'Invalid item_type: %', p_item_type;
  END IF;

  -- Get price and title based on item type
  IF p_item_type = 'product' THEN
    IF p_product_id IS NULL THEN
      RAISE EXCEPTION 'product_id required for product items';
    END IF;
    SELECT estimated_price_tzs, title INTO v_unit_price, v_title
    FROM products
    WHERE id = p_product_id;
    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Product not found';
    END IF;
  ELSIF p_item_type = 'custom_build' THEN
    IF p_custom_build_id IS NULL THEN
      RAISE EXCEPTION 'custom_build_id required for custom_build items';
    END IF;
    SELECT total_estimated_price_tzs, name INTO v_unit_price, v_title
    FROM custom_builds
    WHERE id = p_custom_build_id;
    IF v_unit_price IS NULL THEN
      RAISE EXCEPTION 'Custom build not found';
    END IF;
  END IF;

  -- Check if item already exists in cart
  SELECT id INTO v_existing_item_id
  FROM cart_items
  WHERE cart_id = p_cart_id
    AND item_type = p_item_type
    AND (
      (p_item_type = 'product' AND product_id = p_product_id) OR
      (p_item_type = 'custom_build' AND custom_build_id = p_custom_build_id)
    )
  LIMIT 1;

  IF v_existing_item_id IS NOT NULL THEN
    -- Update quantity
    UPDATE cart_items
    SET quantity = quantity + p_quantity
    WHERE id = v_existing_item_id;
  ELSE
    -- Insert new item
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

  -- Return updated cart
  RETURN QUERY SELECT * FROM get_cart_with_items(p_cart_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove item from cart
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
  DELETE FROM cart_items
  WHERE id = p_item_id AND cart_id = p_cart_id;

  RETURN QUERY SELECT * FROM get_cart_with_items(p_cart_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update cart item quantity
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

  UPDATE cart_items
  SET quantity = p_quantity
  WHERE id = p_item_id AND cart_id = p_cart_id;

  RETURN QUERY SELECT * FROM get_cart_with_items(p_cart_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
