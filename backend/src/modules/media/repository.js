import { supabase } from '../../lib/supabase.js';

export async function insertProductMedia(payload) {
  return supabase.from('product_media').insert(payload).select().single();
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
