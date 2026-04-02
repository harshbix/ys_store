import { supabase } from '../../lib/supabase.js';

export async function requestOtp(phone) {
  return supabase.auth.signInWithOtp({ phone });
}

export async function verifyOtp(phone, token) {
  return supabase.auth.verifyOtp({ phone, token, type: 'sms' });
}

export async function getWishlistByCustomer(customerAuthId) {
  return supabase.from('wishlists').select('*').eq('customer_auth_id', customerAuthId).maybeSingle();
}

export async function createWishlist(customerAuthId) {
  return supabase.from('wishlists').insert({ customer_auth_id: customerAuthId }).select().single();
}

export async function listWishlistItems(wishlistId) {
  return supabase.from('wishlist_items').select('*, products(*)').eq('wishlist_id', wishlistId);
}

export async function addWishlistItem(wishlistId, productId) {
  return supabase.from('wishlist_items').insert({ wishlist_id: wishlistId, product_id: productId });
}

export async function deleteWishlistItem(wishlistId, productId) {
  return supabase.from('wishlist_items').delete().eq('wishlist_id', wishlistId).eq('product_id', productId);
}

export async function findActiveCartByCustomer(customerAuthId) {
  return supabase
    .from('carts')
    .select('*')
    .eq('customer_auth_id', customerAuthId)
    .eq('status', 'active')
    .maybeSingle();
}

export async function createCustomerCart(customerAuthId) {
  return supabase
    .from('carts')
    .insert({ customer_auth_id: customerAuthId })
    .select()
    .single();
}

export async function findCartById(cartId) {
  return supabase.from('carts').select('*').eq('id', cartId).maybeSingle();
}

export async function findCartItems(cartId) {
  return supabase.from('cart_items').select('*').eq('cart_id', cartId);
}

export async function findCartItemByRef(cartId, item) {
  let query = supabase.from('cart_items').select('*').eq('cart_id', cartId).eq('item_type', item.item_type);
  if (item.item_type === 'product') query = query.eq('product_id', item.product_id);
  if (item.item_type === 'custom_build') query = query.eq('custom_build_id', item.custom_build_id);
  return query.maybeSingle();
}

export async function insertCartItem(payload) {
  return supabase.from('cart_items').insert(payload).select().single();
}

export async function updateCartItem(itemId, payload) {
  return supabase.from('cart_items').update(payload).eq('id', itemId).select().single();
}

export async function markCartExpired(cartId) {
  return supabase.from('carts').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', cartId);
}
