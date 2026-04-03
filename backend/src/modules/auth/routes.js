import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireCustomerAuth } from '../../middleware/customerAuth.js';
import { otpRequestLimiter, customerApiLimiter } from '../../middleware/rateLimiters.js';
import {
  requestOtpSchema,
  verifyOtpSchema,
  wishlistItemSchema,
  wishlistItemParamsSchema,
  syncPersistentCartSchema
} from './validator.js';
import {
  requestOtpController,
  verifyOtpController,
  getWishlistController,
  addWishlistItemController,
  deleteWishlistItemController,
  getPersistentCartController,
  syncPersistentCartController
} from './controller.js';

const router = Router();

router.post('/request-otp', otpRequestLimiter, validateRequest(requestOtpSchema), requestOtpController);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtpController);

router.get('/wishlist', customerApiLimiter, requireCustomerAuth, getWishlistController);
router.post('/wishlist/items', customerApiLimiter, requireCustomerAuth, validateRequest(wishlistItemSchema), addWishlistItemController);
router.delete('/wishlist/items/:productId', customerApiLimiter, requireCustomerAuth, validateRequest(wishlistItemParamsSchema, 'params'), deleteWishlistItemController);
router.get('/customer/persistent-cart', customerApiLimiter, requireCustomerAuth, getPersistentCartController);
router.put('/customer/persistent-cart/sync', customerApiLimiter, requireCustomerAuth, validateRequest(syncPersistentCartSchema), syncPersistentCartController);

export default router;
