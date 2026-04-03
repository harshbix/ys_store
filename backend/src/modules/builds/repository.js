import { supabase } from '../../lib/supabase.js';

export async function createBuildRow(payload) {
  return supabase.from('custom_builds').insert(payload).select().single();
}

export async function findBuildById(buildId) {
  return supabase.from('custom_builds').select('*').eq('id', buildId).maybeSingle();
}

export async function findBuildItems(buildId) {
  return supabase
    .from('custom_build_items')
    .select('*, products(*)')
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
      .select()
      .single();
  }

  return supabase.from('custom_build_items').insert(payload).select().single();
}

export async function findBuildItemById(itemId) {
  return supabase
    .from('custom_build_items')
    .select('*')
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
  return supabase.from('custom_builds').update(payload).eq('id', buildId).select().single();
}

export async function findProductSpecs(productId) {
  return supabase.from('product_specs').select('*').eq('product_id', productId);
}

export async function findCompatibilityRules() {
  return supabase.from('compatibility_rules').select('*');
}

export async function findProductPrice(productId) {
  return supabase.from('products').select('id,title,estimated_price_tzs').eq('id', productId).single();
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
