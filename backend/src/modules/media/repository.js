import { supabase } from '../../lib/supabase.js';

export async function createSignedUploadUrl(bucket, path) {
  return supabase.storage.from(bucket).createSignedUploadUrl(path);
}

export function getPublicUrl(bucket, path) {
  return supabase.storage.from(bucket).getPublicUrl(path);
}

export async function insertProductMedia(payload) {
  return supabase.from('product_media').insert(payload).select().single();
}

export async function findProductMediaById(id) {
  return supabase.from('product_media').select('*').eq('id', id).maybeSingle();
}

export async function listProductMedia(productId) {
  return supabase
    .from('product_media')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
}

export async function clearProductPrimaryMedia(productId) {
  return supabase.from('product_media').update({ is_primary: false }).eq('product_id', productId);
}

export async function updateProductMedia(id, payload) {
  return supabase.from('product_media').update(payload).eq('id', id).select().single();
}

export async function deleteProductMedia(id) {
  return supabase.from('product_media').delete().eq('id', id);
}

export async function listShopMedia() {
  return supabase.from('shop_media').select('*').order('sort_order', { ascending: true });
}

export async function insertShopMedia(payload) {
  return supabase.from('shop_media').insert(payload).select().single();
}

export async function updateShopMedia(id, payload) {
  return supabase.from('shop_media').update(payload).eq('id', id).select().single();
}

export async function deleteShopMedia(id) {
  return supabase.from('shop_media').delete().eq('id', id);
}
