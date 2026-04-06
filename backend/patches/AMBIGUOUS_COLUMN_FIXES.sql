-- AMBIGUOUS_COLUMN_FIXES.sql
-- Purpose: Fix newly confirmed runtime SQL errors:
-- 1) upsert_custom_build_item -> column reference "id" is ambiguous (42702)
-- 2) track_quote_whatsapp_click -> column reference "quote_code" is ambiguous (42702)
--
-- Copy/paste this entire file in Supabase SQL Editor and Run.

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
  IF p_component_type NOT IN ('cpu', 'motherboard', 'ram', 'storage', 'psu', 'gpu', 'cooler', 'case') THEN
    RAISE EXCEPTION 'Invalid component_type: %', p_component_type;
  END IF;

  SELECT p.estimated_price_tzs INTO v_product_price
  FROM products p
  WHERE p.id = p_product_id;

  IF v_product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Qualify id to avoid conflict with RETURNS TABLE column "id".
  SELECT cbi.id INTO v_existing_item_id
  FROM custom_build_items cbi
  WHERE cbi.custom_build_id = p_build_id
    AND cbi.component_type = p_component_type::component_type;

  IF v_existing_item_id IS NOT NULL THEN
    UPDATE custom_build_items cbi
    SET product_id = p_product_id,
        quantity = 1,
        unit_estimated_price_tzs = v_product_price
    WHERE cbi.id = v_existing_item_id;
  ELSE
    INSERT INTO custom_build_items (custom_build_id, component_type, product_id, quantity, unit_estimated_price_tzs)
    VALUES (p_build_id, p_component_type::component_type, p_product_id, 1, v_product_price);
  END IF;

  UPDATE custom_builds cb
  SET total_estimated_price_tzs = (
    SELECT COALESCE(SUM(cbi.quantity * cbi.unit_estimated_price_tzs), 0)
    FROM custom_build_items cbi
    WHERE cbi.custom_build_id = p_build_id
  )
  WHERE cb.id = p_build_id;

  RETURN QUERY SELECT * FROM get_custom_build_with_items(p_build_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION track_quote_whatsapp_click(
  p_quote_code text
)
RETURNS TABLE (
  id uuid,
  quote_code text,
  whatsapp_clicked_at timestamptz
) AS $$
BEGIN
  -- Qualify quote_code to avoid conflict with RETURNS TABLE column "quote_code".
  UPDATE quotes q
  SET whatsapp_clicked_at = now(),
      updated_at = now()
  WHERE q.quote_code = p_quote_code;

  RETURN QUERY
  SELECT q.id, q.quote_code, q.whatsapp_clicked_at
  FROM quotes q
  WHERE q.quote_code = p_quote_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
