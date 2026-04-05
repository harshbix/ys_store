-- 013_create_product_creation_rpc.sql
-- RPC for safe product creation with spec validation

CREATE OR REPLACE FUNCTION create_product_with_specs(
  p_sku text,
  p_slug text,
  p_title text,
  p_product_type product_type,
  p_brand text,
  p_model_name text,
  p_condition product_condition,
  p_estimated_price_tzs bigint,
  p_short_description text DEFAULT NULL,
  p_long_description text DEFAULT NULL,
  p_warranty_text text DEFAULT NULL,
  p_specs jsonb DEFAULT NULL,
  p_media_paths text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  sku text,
  slug text,
  title text,
  product_type product_type,
  brand text,
  estimated_price_tzs bigint,
  created_at timestamptz
) AS $$
DECLARE
  v_product_id uuid;
  v_media_path text;
  v_spec_key text;
  v_spec_value jsonb;
  v_spec_exists boolean;
BEGIN
  -- Validate required fields
  IF p_sku IS NULL OR p_slug IS NULL OR p_title IS NULL THEN
    RAISE EXCEPTION 'SKU, slug, and title are required';
  END IF;

  IF p_estimated_price_tzs < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;

  -- Check for duplicate SKU
  IF EXISTS (SELECT 1 FROM products WHERE sku = p_sku) THEN
    RAISE EXCEPTION 'Product with SKU % already exists', p_sku;
  END IF;

  -- Check for duplicate slug
  IF EXISTS (SELECT 1 FROM products WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Product with slug % already exists', p_slug;
  END IF;

  -- Create product
  INSERT INTO products (
    sku, slug, title, product_type, brand, model_name, condition,
    estimated_price_tzs, short_description, long_description, warranty_text,
    is_visible, stock_status, created_at, updated_at
  ) VALUES (
    p_sku, p_slug, p_title, p_product_type, p_brand, p_model_name, p_condition,
    p_estimated_price_tzs, p_short_description, p_long_description, p_warranty_text,
    true, 'in_stock', now(), now()
  ) RETURNING products.id INTO v_product_id;

  -- Insert specs if provided and valid
  IF p_specs IS NOT NULL AND p_specs != '{}'::jsonb THEN
    FOR v_spec_key IN SELECT jsonb_object_keys(p_specs) LOOP
      -- Validate spec key exists in spec_definitions
      SELECT EXISTS(
        SELECT 1 FROM spec_definitions
        WHERE key = v_spec_key AND product_type = p_product_type
      ) INTO v_spec_exists;

      IF NOT v_spec_exists THEN
        RAISE EXCEPTION 'Invalid spec key % for product type %', v_spec_key, p_product_type;
      END IF;

      -- Get the spec value
      v_spec_value := p_specs->v_spec_key;

      -- Insert spec value (deduce type from JSON and store in appropriate column)
      INSERT INTO product_specs (product_id, spec_key, value_text, value_number, value_bool, value_json)
      VALUES (
        v_product_id,
        v_spec_key,
        CASE WHEN jsonb_typeof(v_spec_value) = 'string' THEN trim(both '"' from v_spec_value::text) ELSE NULL END,
        CASE WHEN jsonb_typeof(v_spec_value) = 'number' THEN (v_spec_value::text)::numeric ELSE NULL END,
        CASE WHEN jsonb_typeof(v_spec_value) = 'true' OR jsonb_typeof(v_spec_value) = 'false' THEN (v_spec_value::text)::boolean ELSE NULL END,
        CASE WHEN jsonb_typeof(v_spec_value) = 'object' OR jsonb_typeof(v_spec_value) = 'array' THEN v_spec_value ELSE NULL END
      );
    END LOOP;
  END IF;

  -- Insert media if provided
  IF p_media_paths IS NOT NULL AND array_length(p_media_paths, 1) > 0 THEN
    FOREACH v_media_path IN ARRAY p_media_paths LOOP
      INSERT INTO product_media (product_id, media_url, media_type, is_visible)
      VALUES (v_product_id, v_media_path, 'primary', true);
    END LOOP;
  END IF;

  -- Return created product
  RETURN QUERY
  SELECT p.id, p.sku, p.slug, p.title, p.product_type, p.brand, p.estimated_price_tzs, p.created_at
  FROM products p
  WHERE p.id = v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update product with full validation
CREATE OR REPLACE FUNCTION update_product_with_specs(
  p_product_id uuid,
  p_title text DEFAULT NULL,
  p_brand text DEFAULT NULL,
  p_model_name text DEFAULT NULL,
  p_estimated_price_tzs bigint DEFAULT NULL,
  p_short_description text DEFAULT NULL,
  p_long_description text DEFAULT NULL,
  p_warranty_text text DEFAULT NULL,
  p_specs jsonb DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  brand text,
  estimated_price_tzs bigint,
  updated_at timestamptz
) AS $$
DECLARE
  v_spec_key text;
  v_spec_value jsonb;
  v_product_type product_type;
  v_spec_exists boolean;
BEGIN
  -- Get product type for spec validation
  SELECT product_type INTO v_product_type
  FROM products
  WHERE id = p_product_id;

  IF v_product_type IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Update product fields
  UPDATE products
  SET
    title = COALESCE(p_title, title),
    brand = COALESCE(p_brand, brand),
    model_name = COALESCE(p_model_name, model_name),
    estimated_price_tzs = COALESCE(p_estimated_price_tzs, estimated_price_tzs),
    short_description = COALESCE(p_short_description, short_description),
    long_description = COALESCE(p_long_description, long_description),
    warranty_text = COALESCE(p_warranty_text, warranty_text),
    updated_at = now()
  WHERE id = p_product_id;

  -- Update specs if provided
  IF p_specs IS NOT NULL AND p_specs != '{}'::jsonb THEN
    -- Delete existing specs for this product
    DELETE FROM product_specs WHERE product_id = p_product_id;

    -- Insert new specs with validation
    FOR v_spec_key IN SELECT jsonb_object_keys(p_specs) LOOP
      -- Validate spec key exists in spec_definitions
      SELECT EXISTS(
        SELECT 1 FROM spec_definitions
        WHERE key = v_spec_key AND product_type = v_product_type
      ) INTO v_spec_exists;

      IF NOT v_spec_exists THEN
        RAISE EXCEPTION 'Invalid spec key % for product type %', v_spec_key, v_product_type;
      END IF;

      -- Get the spec value
      v_spec_value := p_specs->v_spec_key;

      -- Insert spec value
      INSERT INTO product_specs (product_id, spec_key, value_text, value_number, value_bool, value_json)
      VALUES (
        p_product_id,
        v_spec_key,
        CASE WHEN jsonb_typeof(v_spec_value) = 'string' THEN trim(both '"' from v_spec_value::text) ELSE NULL END,
        CASE WHEN jsonb_typeof(v_spec_value) = 'number' THEN (v_spec_value::text)::numeric ELSE NULL END,
        CASE WHEN jsonb_typeof(v_spec_value) = 'true' OR jsonb_typeof(v_spec_value) = 'false' THEN (v_spec_value::text)::boolean ELSE NULL END,
        CASE WHEN jsonb_typeof(v_spec_value) = 'object' OR jsonb_typeof(v_spec_value) = 'array' THEN v_spec_value ELSE NULL END
      );
    END LOOP;
  END IF;

  -- Return updated product
  RETURN QUERY
  SELECT p.id, p.title, p.brand, p.estimated_price_tzs, p.updated_at
  FROM products p
  WHERE p.id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
