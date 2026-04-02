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
