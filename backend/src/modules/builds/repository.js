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

export async function deleteBuildItem(itemId) {
  return supabase.from('custom_build_items').delete().eq('id', itemId);
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
