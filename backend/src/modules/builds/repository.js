import { supabase } from '../../lib/supabase.js';

const PRODUCT_SELECT = [
  'id',
  'sku',
  'slug',
  'title',
  'product_type',
  'brand',
  'model_name',
  'condition',
  'stock_status',
  'estimated_price_tzs',
  'short_description',
  'long_description',
  'warranty_text',
  'is_visible',
  'is_featured',
  'featured_tag',
  'created_by_admin_id',
  'created_at',
  'updated_at'
].join(',');

const BUILD_SELECT = [
  'id',
  'build_code',
  'owner_type',
  'customer_auth_id',
  'session_token',
  'name',
  'build_status',
  'compatibility_status',
  'replacement_summary',
  'total_estimated_price_tzs',
  'is_saved',
  'created_at',
  'updated_at'
].join(',');

const BUILD_ITEM_SELECT = [
  'id',
  'custom_build_id',
  'component_type',
  'product_id',
  'quantity',
  'unit_estimated_price_tzs',
  'is_auto_replaced',
  'compatibility_notes',
  'created_at'
].join(',');

const BUILD_ITEM_WITH_PRODUCT_SELECT = `${BUILD_ITEM_SELECT},products(${PRODUCT_SELECT})`;

const PRODUCT_SPEC_SELECT = [
  'id',
  'product_id',
  'spec_key',
  'value_text',
  'value_number',
  'value_bool',
  'value_json',
  'unit',
  'sort_order',
  'created_at'
].join(',');

export async function createBuildRow(payload) {
  return supabase.from('custom_builds').insert(payload).select(BUILD_SELECT).single();
}

export async function findBuildById(buildId) {
  return supabase.from('custom_builds').select(BUILD_SELECT).eq('id', buildId).maybeSingle();
}

export async function findBuildByIdForIdentity(buildId, { sessionToken, customerAuthId }) {
  let query = supabase.from('custom_builds').select(BUILD_SELECT).eq('id', buildId);

  if (customerAuthId) {
    query = query.eq('customer_auth_id', customerAuthId);
  } else {
    query = query.eq('session_token', sessionToken);
  }

  return query.maybeSingle();
}

export async function findBuildItems(buildId) {
  return supabase
    .from('custom_build_items')
    .select(BUILD_ITEM_WITH_PRODUCT_SELECT)
    .eq('custom_build_id', buildId)
    .order('created_at', { ascending: true });
}

export async function upsertBuildComponent(payload) {
  const existing = await supabase
    .from('custom_build_items')
    .select('id')
    .eq('custom_build_id', payload.custom_build_id)
    .eq('component_type', payload.component_type)
    .maybeSingle();

  if (existing.error) return existing;

  if (existing.data?.id) {
    return supabase
      .from('custom_build_items')
      .update(payload)
      .eq('id', existing.data.id)
      .select(BUILD_ITEM_SELECT)
      .single();
  }

  return supabase.from('custom_build_items').insert(payload).select(BUILD_ITEM_SELECT).single();
}

export async function findBuildItemById(itemId) {
  return supabase
    .from('custom_build_items')
    .select(BUILD_ITEM_SELECT)
    .eq('id', itemId)
    .maybeSingle();
}

export async function deleteBuildItem(itemId, buildId) {
  const query = supabase
    .from('custom_build_items')
    .delete()
    .eq('id', itemId);

  return buildId ? query.eq('custom_build_id', buildId) : query;
}

export async function updateBuild(buildId, payload) {
  return supabase.from('custom_builds').update(payload).eq('id', buildId).select(BUILD_SELECT).single();
}

export async function findProductSpecs(productId) {
  return supabase.from('product_specs').select(PRODUCT_SPEC_SELECT).eq('product_id', productId);
}

export async function findCompatibilityRules() {
  return supabase.from('compatibility_rules').select('*');
}

export async function findProductPrice(productId) {
  return supabase.from('pc_components').select('id,name,price_tzs').eq('id', productId).single();
}

export async function findComponentBySpecText(componentType, specKey, value) {
  const matchIds = await supabase
    .from('product_specs')
    .select('product_id')
    .eq('spec_key', specKey)
    .eq('value_text', value);

  if (matchIds.error) return matchIds;
  const ids = (matchIds.data || []).map((r) => r.product_id);
  if (!ids.length) return { data: null, error: null };

  return supabase
    .from('products')
    .select('id,title,estimated_price_tzs')
    .eq('product_type', 'component')
    .in('id', ids)
    .eq('is_visible', true)
    .neq('stock_status', 'sold_out')
    .limit(1)
    .maybeSingle();
}

export async function findComponentBySpecNumberMin(componentType, specKey, minValue) {
  const matchIds = await supabase
    .from('product_specs')
    .select('product_id')
    .eq('spec_key', specKey)
    .gte('value_number', minValue);

  if (matchIds.error) return matchIds;
  const ids = (matchIds.data || []).map((r) => r.product_id);
  if (!ids.length) return { data: null, error: null };

  return supabase
    .from('products')
    .select('id,title,estimated_price_tzs')
    .eq('product_type', 'component')
    .in('id', ids)
    .eq('is_visible', true)
    .neq('stock_status', 'sold_out')
    .order('estimated_price_tzs', { ascending: true })
    .limit(1)
    .maybeSingle();
}
