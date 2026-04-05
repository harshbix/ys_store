import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireCustomerAuth } from '../../middleware/customerAuth.js';
import { otpRequestLimiter } from '../../middleware/rateLimiters.js';
import {
  registerSchema,
  passwordLoginSchema,
  requestOtpSchema,
  verifyOtpSchema,
  wishlistItemSchema,
  wishlistItemParamsSchema,
  syncPersistentCartSchema
} from './validator.js';
import {
  registerController,
  loginController,
  requestOtpController,
  verifyOtpController,
  getWishlistController,
  addWishlistItemController,
  deleteWishlistItemController,
  getPersistentCartController,
  syncPersistentCartController
} from './controller.js';

const router = Router();

router.post('/register', validateRequest(registerSchema), registerController);
router.post('/login', validateRequest(passwordLoginSchema), loginController);

router.post('/request-otp', otpRequestLimiter, validateRequest(requestOtpSchema), requestOtpController);
router.post('/verify-otp', validateRequest(verifyOtpSchema), verifyOtpController);

router.get('/wishlist', requireCustomerAuth, getWishlistController);
router.post('/wishlist/items', requireCustomerAuth, validateRequest(wishlistItemSchema), addWishlistItemController);
router.delete('/wishlist/items/:productId', requireCustomerAuth, validateRequest(wishlistItemParamsSchema, 'params'), deleteWishlistItemController);
router.get('/customer/persistent-cart', requireCustomerAuth, getPersistentCartController);
router.put('/customer/persistent-cart/sync', requireCustomerAuth, validateRequest(syncPersistentCartSchema), syncPersistentCartController);

export default router;
