-- 014_create_build_management_rpc.sql
-- RPC for custom build creation, validation, and management

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

  -- Create new build
  INSERT INTO custom_builds (
    customer_auth_id,
    session_token,
    owner_type,
    name,
    build_status,
    compatibility_status,
    total_estimated_price_tzs
  ) VALUES (
    p_customer_auth_id,
    p_session_token,
    v_owner_type,
    COALESCE(p_name, 'My Custom Build'),
    'draft'::build_status,
    'warning'::compatibility_status,
    0
  ) RETURNING custom_builds.id INTO v_build_id;

  -- Return newly created build
  RETURN QUERY
  SELECT b.id, b.build_code, b.owner_type::text, b.name, b.build_status::text, b.compatibility_status::text, b.total_estimated_price_tzs, b.created_at
  FROM custom_builds b
  WHERE b.id = v_build_id;
END;
$$ LANGUAGE plpgsql SECURITY REPLICATE;

-- Get custom build with items
CREATE OR REPLACE FUNCTION get_custom_build_with_items(
  p_build_id uuid
)
RETURNS TABLE (
  id uuid,
  build_code text,
  owner_type text,
  name text,
  build_status text,
  compatibility_status text,
  total_estimated_price_tzs bigint,
  items json,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.build_code,
    b.owner_type::text,
    b.name,
    b.build_status::text,
    b.compatibility_status::text,
    b.total_estimated_price_tzs,
    COALESCE(
      json_agg(
        json_build_object(
          'id', bi.id,
          'custom_build_id', bi.custom_build_id,
          'component_type', bi.component_type::text,
          'product_id', bi.product_id,
          'quantity', bi.quantity,
          'unit_estimated_price_tzs', bi.unit_estimated_price_tzs,
          'is_auto_replaced', bi.is_auto_replaced,
          'compatibility_notes', bi.compatibility_notes,
          'created_at', bi.created_at
        ) ORDER BY bi.created_at
      ),
      '[]'::json
    ),
    b.created_at,
    b.updated_at
  FROM custom_builds b
  LEFT JOIN custom_build_items bi ON b.id = bi.custom_build_id
  WHERE b.id = p_build_id
  GROUP BY b.id, b.build_code, b.owner_type, b.name, b.build_status, b.compatibility_status, b.total_estimated_price_tzs, b.created_at, b.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY REPLICATE;

-- Upsert build item (add or update component)
CREATE OR REPLACE FUNCTION upsert_custom_build_item(
  p_build_id uuid,
  p_component_type text,
  p_product_id uuid
)
RETURNS TABLE (
  id uuid,
  build_code text,
  owner_type text,
  name text,
  build_status text,
  compatibility_status text,
  total_estimated_price_tzs bigint,
  items json,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
DECLARE
  v_existing_item_id uuid;
  v_product_price bigint;
  v_product_title text;
BEGIN
  -- Validate component type
  IF p_component_type NOT IN ('cpu', 'motherboard', 'ram', 'storage', 'psu', 'gpu', 'cooler', 'case') THEN
    RAISE EXCEPTION 'Invalid component_type: %', p_component_type;
  END IF;

  -- Get product price and validate it exists
  SELECT estimated_price_tzs INTO v_product_price
  FROM products
  WHERE id = p_product_id;

  IF v_product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Check if item with this component type already exists
  SELECT id INTO v_existing_item_id
  FROM custom_build_items
  WHERE custom_build_id = p_build_id
    AND component_type = p_component_type::component_type;

  IF v_existing_item_id IS NOT NULL THEN
    -- Update existing item
    UPDATE custom_build_items
    SET product_id = p_product_id, quantity = 1, unit_estimated_price_tzs = v_product_price
    WHERE id = v_existing_item_id;
  ELSE
    -- Insert new item
    INSERT INTO custom_build_items (custom_build_id, component_type, product_id, quantity, unit_estimated_price_tzs)
    VALUES (p_build_id, p_component_type::component_type, p_product_id, 1, v_product_price);
  END IF;

  -- Recalculate build total
  UPDATE custom_builds
  SET total_estimated_price_tzs = (
    SELECT COALESCE(SUM(quantity * unit_estimated_price_tzs), 0)
    FROM custom_build_items
    WHERE custom_build_id = p_build_id
  )
  WHERE id = p_build_id;

  -- Return updated build
  RETURN QUERY SELECT * FROM get_custom_build_with_items(p_build_id);
END;
$$ LANGUAGE plpgsql SECURITY REPLICATE;

-- Delete build item
CREATE OR REPLACE FUNCTION delete_custom_build_item(
  p_build_id uuid,
  p_item_id uuid
)
RETURNS TABLE (
  id uuid,
  build_code text,
  owner_type text,
  name text,
  build_status text,
  compatibility_status text,
  total_estimated_price_tzs bigint,
  items json,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
BEGIN
  DELETE FROM custom_build_items
  WHERE id = p_item_id AND custom_build_id = p_build_id;

  -- Recalculate build total
  UPDATE custom_builds
  SET total_estimated_price_tzs = (
    SELECT COALESCE(SUM(quantity * unit_estimated_price_tzs), 0)
    FROM custom_build_items
    WHERE custom_build_id = p_build_id
  )
  WHERE id = p_build_id;

  RETURN QUERY SELECT * FROM get_custom_build_with_items(p_build_id);
END;
$$ LANGUAGE plpgsql SECURITY REPLICATE;

-- Validate build (check required components)
CREATE OR REPLACE FUNCTION validate_custom_build(
  p_build_id uuid
)
RETURNS TABLE (
  compatibility_status text,
  build_status text,
  missing_components text[],
  warnings text[],
  is_valid boolean
) AS $$
DECLARE
  v_required_components text[] := ARRAY['cpu', 'motherboard', 'ram', 'storage', 'psu'];
  v_selected_components text[];
  v_missing_components text[];
  v_is_valid boolean;
  v_warnings text[];
BEGIN
  -- Get selected component types
  SELECT ARRAY_AGG(DISTINCT component_type::text)
  INTO v_selected_components
  FROM custom_build_items
  WHERE custom_build_id = p_build_id;

  v_selected_components := COALESCE(v_selected_components, ARRAY[]::text[]);

  -- Calculate missing components
  v_missing_components := ARRAY(
    SELECT component FROM UNNEST(v_required_components) AS component
    WHERE component NOT IN (SELECT UNNEST(v_selected_components))
  );

  v_is_valid := ARRAY_LENGTH(v_missing_components, 1) IS NULL;

  -- Generate warnings
  v_warnings := CASE
    WHEN NOT v_is_valid THEN
      ARRAY(SELECT 'Missing ' || component || ' in build.' FROM UNNEST(v_missing_components) AS component)
    ELSE ARRAY[]::text[]
  END;

  -- Update build status
  UPDATE custom_builds
  SET
    compatibility_status = CASE WHEN v_is_valid THEN 'valid'::compatibility_status ELSE 'warning'::compatibility_status END,
    build_status = CASE WHEN v_is_valid THEN 'valid'::build_status ELSE 'draft'::build_status END,
    updated_at = now()
  WHERE id = p_build_id;

  RETURN QUERY SELECT
    (CASE WHEN v_is_valid THEN 'valid' ELSE 'warning' END)::text,
    (CASE WHEN v_is_valid THEN 'valid' ELSE 'draft' END)::text,
    v_missing_components,
    v_warnings,
    v_is_valid;
END;
$$ LANGUAGE plpgsql SECURITY REPLICATE;
