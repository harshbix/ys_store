import { supabase } from '../../lib/supabase.js';

export async function findActiveCartByIdentity({ sessionToken, customerAuthId }) {
  let query = supabase.from('carts').select('*').eq('status', 'active').limit(1);

  if (customerAuthId) {
    query = query.eq('customer_auth_id', customerAuthId);
  } else {
    query = query.eq('session_token', sessionToken);
  }

  return query.maybeSingle();
}

export async function createCart({ sessionToken, customerAuthId }) {
  return supabase.from('carts').insert({ session_token: sessionToken, customer_auth_id: customerAuthId || null }).select().single();
}

export async function findCartItems(cartId) {
  return supabase.from('cart_items').select('*').eq('cart_id', cartId);
}

export async function insertCartItem(payload) {
  return supabase.from('cart_items').insert(payload).select().single();
}

export async function updateCartItem(itemId, payload) {
  return supabase.from('cart_items').update(payload).eq('id', itemId).select().single();
}

export async function deleteCartItem(itemId) {
  return supabase.from('cart_items').delete().eq('id', itemId);
}

export async function findProductPriceAndTitle(productId) {
  return supabase.from('products').select('id,title,estimated_price_tzs').eq('id', productId).single();
}

export async function findBuildPriceAndTitle(buildId) {
  return supabase.from('custom_builds').select('id,name,total_estimated_price_tzs').eq('id', buildId).single();
}
