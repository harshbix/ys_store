import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createUploadUrlSchema, finalizeUploadSchema, mediaIdParamsSchema } from './validator.js';
import {
  createUploadUrlController,
  finalizeUploadController,
  listShopMediaController,
  updateShopMediaController,
  deleteShopMediaController
} from './controller.js';

const router = Router();

router.get('/shop-media', listShopMediaController);
router.post('/admin/upload-url', requireAdmin, validateRequest(createUploadUrlSchema), createUploadUrlController);
router.post('/admin/upload/finalize', requireAdmin, validateRequest(finalizeUploadSchema), finalizeUploadController);
router.post('/admin/upload', requireAdmin, validateRequest(finalizeUploadSchema), finalizeUploadController);
router.get('/admin/shop-media', requireAdmin, listShopMediaController);
router.patch('/admin/shop-media/:id', requireAdmin, validateRequest(mediaIdParamsSchema, 'params'), updateShopMediaController);
router.delete('/admin/shop-media/:id', requireAdmin, validateRequest(mediaIdParamsSchema, 'params'), deleteShopMediaController);

export default router;
