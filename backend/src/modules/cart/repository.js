import { supabase } from '../../lib/supabase.js';

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

export async function findActiveCartByIdentity({ sessionToken, customerAuthId }) {
  let query = supabase.from('carts').select(CART_SELECT).eq('status', 'active').limit(1);

  if (customerAuthId) {
    query = query.eq('customer_auth_id', customerAuthId);
  } else {
    query = query.eq('session_token', sessionToken);
  }

  return query.maybeSingle();
}

export async function createCart({ sessionToken, customerAuthId }) {
  return supabase.from('carts').insert({ session_token: sessionToken, customer_auth_id: customerAuthId || null }).select(CART_SELECT).single();
}

export async function findCartItems(cartId) {
  return supabase.from('cart_items').select(CART_ITEM_SELECT).eq('cart_id', cartId);
}

export async function insertCartItem(payload) {
  return supabase.from('cart_items').insert(payload).select(CART_ITEM_SELECT).single();
}

export async function findCartItemByRef(cartId, payload) {
  let query = supabase.from('cart_items').select(CART_ITEM_SELECT).eq('cart_id', cartId).eq('item_type', payload.item_type);
  if (payload.item_type === 'product') query = query.eq('product_id', payload.product_id);
  if (payload.item_type === 'custom_build') query = query.eq('custom_build_id', payload.custom_build_id);
  return query.maybeSingle();
}

export async function findCartItemById(cartId, itemId) {
  return supabase.from('cart_items').select(CART_ITEM_SELECT).eq('cart_id', cartId).eq('id', itemId).maybeSingle();
}

export async function updateCartItem(itemId, payload, cartId = null) {
  let query = supabase.from('cart_items').update(payload).eq('id', itemId);
  if (cartId) query = query.eq('cart_id', cartId);
  return query.select(CART_ITEM_SELECT).single();
}

export async function deleteCartItem(itemId, cartId = null) {
  let query = supabase.from('cart_items').delete().eq('id', itemId);
  if (cartId) query = query.eq('cart_id', cartId);
  return query;
}

export async function findProductPriceAndTitle(productId) {
  return supabase.from('products').select('id,title,estimated_price_tzs').eq('id', productId).single();
}

export async function findBuildPriceAndTitle(buildId, identity = null) {
  let query = supabase.from('custom_builds').select('id,name,total_estimated_price_tzs').eq('id', buildId);

  if (identity?.customerAuthId) {
    query = query.eq('customer_auth_id', identity.customerAuthId);
  } else if (identity?.sessionToken) {
    query = query.eq('session_token', identity.sessionToken);
  }

  return query.single();
}
