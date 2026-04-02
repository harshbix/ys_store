import { Router } from 'express';
import { ensureGuestSession } from '../../middleware/guestSession.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { addCartItemSchema, updateCartItemParamsSchema, updateCartItemSchema } from './validator.js';
import { getCart, addCartItem, updateCartItemQuantity, removeCartItemById } from './controller.js';

const router = Router();

router.use(ensureGuestSession);
router.get('/', getCart);
router.post('/items', validateRequest(addCartItemSchema), addCartItem);
router.patch('/items/:itemId', validateRequest(updateCartItemParamsSchema, 'params'), validateRequest(updateCartItemSchema), updateCartItemQuantity);
router.delete('/items/:itemId', validateRequest(updateCartItemParamsSchema, 'params'), removeCartItemById);

export default router;
