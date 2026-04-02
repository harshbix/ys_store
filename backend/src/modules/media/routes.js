import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { uploadMediaSchema, mediaIdParamsSchema } from './validator.js';
import {
  uploadMediaController,
  listShopMediaController,
  updateShopMediaController,
  deleteShopMediaController
} from './controller.js';

const router = Router();

router.get('/shop-media', listShopMediaController);
router.post('/admin/upload', requireAdmin, validateRequest(uploadMediaSchema), uploadMediaController);
router.get('/admin/shop-media', requireAdmin, listShopMediaController);
router.patch('/admin/shop-media/:id', requireAdmin, validateRequest(mediaIdParamsSchema, 'params'), updateShopMediaController);
router.delete('/admin/shop-media/:id', requireAdmin, validateRequest(mediaIdParamsSchema, 'params'), deleteShopMediaController);

export default router;
