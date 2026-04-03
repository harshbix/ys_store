import jwt from 'jsonwebtoken';
import {
  requestOtp,
  verifyOtp,
  getWishlistByCustomer,
  createWishlist,
  listWishlistItems,
  addWishlistItem,
  deleteWishlistItem,
  findActiveCartByCustomer,
  createCustomerCart,
  findCartById,
  findCartItems,
  findCartItemByRef,
  insertCartItem,
  updateCartItem,
  markCartExpired
} from './repository.js';
import { env } from '../../config/env.js';

export async function startOtp(phone) {
  const result = await requestOtp(phone);
  if (result.error) throw { status: 500, code: 'otp_request_failed', message: result.error.message };
  return { challenge_id: `OTP-${Date.now()}` };
}

export async function confirmOtp(challengeId, code, phone) {
  const result = await verifyOtp(phone, code);
  if (result.error) throw { status: 401, code: 'otp_verify_failed', message: result.error.message };

  const token = jwt.sign({ sub: result.data.user.id, type: 'customer' }, env.customerJwtSecret, { expiresIn: '30d' });
  return { access_token: token, customer_id: result.data.user.id, challenge_id: challengeId };
}

async function ensureWishlist(customerAuthId) {
  const found = await getWishlistByCustomer(customerAuthId);
  if (found.error) throw { status: 500, code: 'wishlist_lookup_failed', message: found.error.message };
  if (found.data) return found.data;

  const created = await createWishlist(customerAuthId);
  if (created.error) throw { status: 500, code: 'wishlist_create_failed', message: created.error.message };
  return created.data;
}

export async function getWishlist(customerAuthId) {
  const wl = await ensureWishlist(customerAuthId);
  const items = await listWishlistItems(wl.id);
  if (items.error) throw { status: 500, code: 'wishlist_items_failed', message: items.error.message };
  return { wishlist_id: wl.id, items: items.data || [] };
}

export async function addToWishlist(customerAuthId, productId) {
  const wl = await ensureWishlist(customerAuthId);
  const added = await addWishlistItem(wl.id, productId);
  if (added.error) throw { status: 500, code: 'wishlist_add_failed', message: added.error.message };
  return getWishlist(customerAuthId);
}

export async function removeFromWishlist(customerAuthId, productId) {
  const wl = await ensureWishlist(customerAuthId);
  const removed = await deleteWishlistItem(wl.id, productId);
  if (removed.error) throw { status: 500, code: 'wishlist_remove_failed', message: removed.error.message };
  return getWishlist(customerAuthId);
}

export async function getPersistentCart(customerAuthId) {
  let cartRes = await findActiveCartByCustomer(customerAuthId);
  if (cartRes.error) throw { status: 500, code: 'customer_cart_lookup_failed', message: cartRes.error.message };

  if (!cartRes.data) {
    cartRes = await createCustomerCart(customerAuthId);
    if (cartRes.error) throw { status: 500, code: 'customer_cart_create_failed', message: cartRes.error.message };
  }

  const itemsRes = await findCartItems(cartRes.data.id);
  if (itemsRes.error) throw { status: 500, code: 'customer_cart_items_failed', message: itemsRes.error.message };

  const items = itemsRes.data || [];
  const estimated_total_tzs = items.reduce((acc, i) => acc + Number(i.unit_estimated_price_tzs) * Number(i.quantity), 0);

  return {
    customer_auth_id: customerAuthId,
    cart: cartRes.data,
    items,
    estimated_total_tzs
  };
}

export async function syncPersistentCart(customerAuthId, payload) {
  const customerCart = await getPersistentCart(customerAuthId);

  let sourceItems = [];
  if (payload.source_cart_id) {
    const srcCartRes = await findCartById(payload.source_cart_id);
    if (srcCartRes.error) throw { status: 500, code: 'source_cart_lookup_failed', message: srcCartRes.error.message };
    if (srcCartRes.data) {
      const srcItemsRes = await findCartItems(payload.source_cart_id);
      if (srcItemsRes.error) throw { status: 500, code: 'source_cart_items_failed', message: srcItemsRes.error.message };
      sourceItems = srcItemsRes.data || [];
    }
  } else if (Array.isArray(payload.items)) {
    sourceItems = payload.items.map((i) => ({
      item_type: i.item_type,
      product_id: i.product_id || null,
      custom_build_id: i.custom_build_id || null,
      quantity: i.quantity,
      unit_estimated_price_tzs: 0,
      title_snapshot: i.item_type === 'product' ? 'Product' : 'Custom Build',
      specs_snapshot: null
    }));
  }

  for (const item of sourceItems) {
    const existing = await findCartItemByRef(customerCart.cart.id, item);
    if (existing.error) throw { status: 500, code: 'sync_item_lookup_failed', message: existing.error.message };

    if (existing.data) {
      const updated = await updateCartItem(existing.data.id, {
        quantity: Number(existing.data.quantity) + Number(item.quantity)
      });
      if (updated.error) throw { status: 500, code: 'sync_item_update_failed', message: updated.error.message };
    } else {
      const inserted = await insertCartItem({
        cart_id: customerCart.cart.id,
        item_type: item.item_type,
        product_id: item.product_id || null,
        custom_build_id: item.custom_build_id || null,
        quantity: Number(item.quantity),
        unit_estimated_price_tzs: Number(item.unit_estimated_price_tzs || 0),
        title_snapshot: item.title_snapshot || (item.item_type === 'product' ? 'Product' : 'Custom Build'),
        specs_snapshot: item.specs_snapshot || null
      });
      if (inserted.error) throw { status: 500, code: 'sync_item_insert_failed', message: inserted.error.message };
    }
  }

  if (payload.source_cart_id) {
    const expired = await markCartExpired(payload.source_cart_id);
    if (expired.error) throw { status: 500, code: 'source_cart_expire_failed', message: expired.error.message };
  }

  return getPersistentCart(customerAuthId);
}
