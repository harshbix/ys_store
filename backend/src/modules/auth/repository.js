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

const WISHLIST_ITEM_SELECT = `id,wishlist_id,product_id,created_at,products(${PRODUCT_SELECT})`;

const CART_SELECT = [
  'id',
  'session_token',
  'customer_auth_id',
  'status',
  'created_at',
  'updated_at',
  'expires_at'
].join(',');

const CART_ITEM_SELECT = [
  'id',
  'cart_id',
  'item_type',
  'product_id',
  'custom_build_id',
  'quantity',
  'unit_estimated_price_tzs',
  'title_snapshot',
  'specs_snapshot',
  'created_at'
].join(',');

export async function requestOtp(email) {
  return supabase.auth.signInWithOtp({ email });
}

export async function verifyOtp(email, token) {
  return supabase.auth.verifyOtp({ email, token, type: 'email' });
}

export async function getWishlistByCustomer(customerAuthId) {
  return supabase.from('wishlists').select('*').eq('customer_auth_id', customerAuthId).maybeSingle();
}

export async function createWishlist(customerAuthId) {
  return supabase.from('wishlists').insert({ customer_auth_id: customerAuthId }).select().single();
}

export async function listWishlistItems(wishlistId) {
  return supabase.from('wishlist_items').select(WISHLIST_ITEM_SELECT).eq('wishlist_id', wishlistId);
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
    .select(CART_SELECT)
    .eq('customer_auth_id', customerAuthId)
    .eq('status', 'active')
    .maybeSingle();
}

export async function createCustomerCart(customerAuthId) {
  return supabase
    .from('carts')
    .insert({ customer_auth_id: customerAuthId })
    .select(CART_SELECT)
    .single();
}

export async function findCartById(cartId) {
  return supabase.from('carts').select(CART_SELECT).eq('id', cartId).maybeSingle();
}

export async function findCartItems(cartId) {
  return supabase.from('cart_items').select(CART_ITEM_SELECT).eq('cart_id', cartId);
}

export async function findCartItemByRef(cartId, item) {
  let query = supabase.from('cart_items').select(CART_ITEM_SELECT).eq('cart_id', cartId).eq('item_type', item.item_type);
  if (item.item_type === 'product') query = query.eq('product_id', item.product_id);
  if (item.item_type === 'custom_build') query = query.eq('custom_build_id', item.custom_build_id);
  return query.maybeSingle();
}

export async function insertCartItem(payload) {
  return supabase.from('cart_items').insert(payload).select(CART_ITEM_SELECT).single();
}

export async function updateCartItem(itemId, payload) {
  return supabase.from('cart_items').update(payload).eq('id', itemId).select(CART_ITEM_SELECT).single();
}

export async function markCartExpired(cartId) {
  return supabase.from('carts').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', cartId);
}
