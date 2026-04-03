import { ok, created } from '../../utils/apiResponse.js';
import {
  startOtp,
  confirmOtp,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getPersistentCart,
  syncPersistentCart
} from './service.js';

export async function requestOtpController(req, res, next) {
  try {
    const data = await startOtp(req.body.email);
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function verifyOtpController(req, res, next) {
  try {
    const email = req.body.email || '';
    const data = await confirmOtp(req.body.challenge_id, req.body.code, email);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getWishlistController(req, res, next) {
  try {
    const data = await getWishlist(req.customerAuthId);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function addWishlistItemController(req, res, next) {
  try {
    const data = await addToWishlist(req.customerAuthId, req.body.product_id);
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function deleteWishlistItemController(req, res, next) {
  try {
    const data = await removeFromWishlist(req.customerAuthId, req.params.productId);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getPersistentCartController(req, res, next) {
  try {
    const data = await getPersistentCart(req.customerAuthId);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function syncPersistentCartController(req, res, next) {
  try {
    const data = await syncPersistentCart(req.customerAuthId, req.body);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}
