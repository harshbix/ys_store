import jwt from 'jsonwebtoken';
import {
  registerWithPassword,
  loginWithPassword,
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

function issueCustomerToken(customerAuthId) {
  return jwt.sign({ sub: customerAuthId, type: 'customer' }, env.adminJwtSecret, { expiresIn: '30d' });
}

function authPayloadFromUser(user, challengeId = null) {
  return {
    access_token: issueCustomerToken(user.id),
    customer_id: user.id,
    challenge_id: challengeId
  };
}

export async function registerCustomer(fullName, email, password) {
  const created = await registerWithPassword(email, password, fullName);

  if (created.error) {
    const providerStatus = Number(created.error.status);
    const providerCode = String(created.error.code || '').toLowerCase();
    const providerMessage = String(created.error.message || '').toLowerCase();

    let status = providerStatus === 422 ? 409 : 400;
    if (providerStatus === 429 || providerCode === 'over_email_send_rate_limit') {
      status = 429;
    } else if (
      providerCode === 'user_already_exists'
      || providerCode === 'user_already_registered'
      || providerMessage.includes('already registered')
      || providerMessage.includes('already exists')
    ) {
      status = 409;
    } else if (providerCode === 'email_address_invalid' || providerMessage.includes('email address') && providerMessage.includes('invalid')) {
      status = 400;
    }

    const message = status === 429
      ? 'Too many account requests right now. Please try again later.'
      : status === 409
        ? 'An account with this email already exists.'
        : status === 400
          ? 'This email address is not valid.'
          : 'Could not create account with this email.';

    throw {
      status,
      code: 'register_failed',
      message
    };
  }

  const user = created.data?.user;
  if (!user?.id) {
    throw { status: 500, code: 'register_failed', message: 'Account created but login session could not start.' };
  }

  return authPayloadFromUser(user, null);
}

export async function loginCustomer(email, password) {
  const result = await loginWithPassword(email, password);
  if (result.error || !result.data?.user?.id) {
    throw { status: 401, code: 'login_failed', message: 'Invalid email or password.' };
  }

  return authPayloadFromUser(result.data.user, null);
}

export async function startOtp(email) {
  const result = await requestOtp(email);
  if (result.error) {
    const providerStatus = Number(result.error.status);
    const providerCode = String(result.error.code || '').toLowerCase();

    let status = Number.isInteger(providerStatus) && providerStatus >= 400 && providerStatus < 500
      ? providerStatus
      : 0;

    if (!status) {
      if (providerCode === 'over_email_send_rate_limit') {
        status = 429;
      } else if (providerCode === 'email_address_invalid') {
        status = 400;
      }
    }

    if (!status) {
      status = 500;
    }

    throw {
      status,
      code: 'otp_request_failed',
      message: status === 429
        ? 'Too many OTP requests. Please try again later.'
        : 'Could not send email verification code'
    };
  }
  return { challenge_id: `OTP-${Date.now()}` };
}

export async function confirmOtp(challengeId, code, email) {
  const result = await verifyOtp(email, code);
  if (result.error) throw { status: 401, code: 'otp_verify_failed', message: 'Invalid or expired verification code' };

  return authPayloadFromUser(result.data.user, challengeId);
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
