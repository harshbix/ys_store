import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireCustomerAuth } from '../../middleware/customerAuth.js';
import { otpRequestLimiter } from '../../middleware/rateLimiters.js';
import { requestOtpSchema, verifyOtpSchema, wishlistItemSchema, wishlistItemParamsSchema } from './validator.js';
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

router.get('/wishlist', requireCustomerAuth, getWishlistController);
router.post('/wishlist/items', requireCustomerAuth, validateRequest(wishlistItemSchema), addWishlistItemController);
router.delete('/wishlist/items/:productId', requireCustomerAuth, validateRequest(wishlistItemParamsSchema, 'params'), deleteWishlistItemController);
router.get('/customer/persistent-cart', requireCustomerAuth, getPersistentCartController);
router.put('/customer/persistent-cart/sync', requireCustomerAuth, syncPersistentCartController);

export default router;
