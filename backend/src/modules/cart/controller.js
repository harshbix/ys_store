import { ok, created } from '../../utils/apiResponse.js';
import { getCartWithItems, addItemToCart, updateItemQuantity, removeItemFromCart } from './service.js';

function getIdentity(req) {
  return {
    sessionToken: req.sessionToken,
    customerAuthId: req.customerAuthId || null
  };
}

export async function getCart(req, res, next) {
  try {
    const data = await getCartWithItems(getIdentity(req));
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function addCartItem(req, res, next) {
  try {
    const data = await addItemToCart(getIdentity(req), req.body);
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function updateCartItemQuantity(req, res, next) {
  try {
    const data = await updateItemQuantity(getIdentity(req), req.params.itemId, req.body.quantity);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function removeCartItemById(req, res, next) {
  try {
    const data = await removeItemFromCart(getIdentity(req), req.params.itemId);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}
