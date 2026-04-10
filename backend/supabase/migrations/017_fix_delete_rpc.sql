-- Copy and paste this script into your Supabase Dashboard -> SQL Editor 
-- and click 'RUN'. It fixes the ambiguous column reference error that 
-- causes the 400 Bad Request when trying to remove components from a custom build.

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
  -- Fix: Alias the table as 'ci' so the WHERE clause doesn't confuse the target
  -- table column 'id' with the RETURNS TABLE output parameter 'id'
  DELETE FROM custom_build_items ci
  WHERE ci.id = p_item_id AND ci.custom_build_id = p_build_id;

  -- Recalculate build total (Also Aliased cb and i to be safe)
  UPDATE custom_builds cb
  SET total_estimated_price_tzs = (
    SELECT COALESCE(SUM(quantity * unit_estimated_price_tzs), 0)
    FROM custom_build_items i
    WHERE i.custom_build_id = p_build_id
  )
  WHERE cb.id = p_build_id;

  RETURN QUERY SELECT * FROM get_custom_build_with_items(p_build_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
