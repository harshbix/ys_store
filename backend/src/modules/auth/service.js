import jwt from 'jsonwebtoken';
import {
  requestOtp,
  verifyOtp,
  getWishlistByCustomer,
  createWishlist,
  listWishlistItems,
  addWishlistItem,
  deleteWishlistItem
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

  const token = jwt.sign({ sub: result.data.user.id, type: 'customer' }, env.adminJwtSecret, { expiresIn: '30d' });
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
  // Safest MVP-compatible option: use cart service linkage in implementation step.
  return { customer_auth_id: customerAuthId, cart: null };
}

export async function syncPersistentCart(customerAuthId, payload) {
  return { customer_auth_id: customerAuthId, synced: true, payload };
}
