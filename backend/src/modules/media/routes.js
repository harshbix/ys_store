import { Router } from 'express';
import multer from 'multer';
import { compressUploadMiddleware } from './compress-middleware.js';
import { uploadImageController } from './upload-image-controller.js';
import { requireAdmin } from '../../middleware/adminAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createUploadUrlSchema, finalizeUploadSchema, mediaIdParamsSchema, updateProductMediaSchema } from './validator.js';
import {
  createUploadUrlController,
  deleteProductMediaController,
  finalizeUploadController,
  listShopMediaController,
  updateProductMediaController,
  updateShopMediaController,
  deleteShopMediaController
} from './controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Accept up to 5MB, compress to <=1.5MB
});
// Production-level endpoint: compress, enforce size, upload to storage, return metadata only
router.post(
  '/admin/upload/image',
  requireAdmin,
  upload.single('file'),
  compressUploadMiddleware,
  uploadImageController
);

router.get('/shop-media', listShopMediaController);
router.post('/admin/upload-url', requireAdmin, validateRequest(createUploadUrlSchema), createUploadUrlController);
router.post('/admin/upload/finalize', requireAdmin, validateRequest(finalizeUploadSchema), finalizeUploadController);
router.post('/admin/upload', requireAdmin, validateRequest(finalizeUploadSchema), finalizeUploadController);
router.patch('/admin/product-media/:id', requireAdmin, validateRequest(mediaIdParamsSchema, 'params'), validateRequest(updateProductMediaSchema), updateProductMediaController);
router.delete('/admin/product-media/:id', requireAdmin, validateRequest(mediaIdParamsSchema, 'params'), deleteProductMediaController);
router.get('/admin/shop-media', requireAdmin, listShopMediaController);
router.patch('/admin/shop-media/:id', requireAdmin, validateRequest(mediaIdParamsSchema, 'params'), updateShopMediaController);
router.delete('/admin/shop-media/:id', requireAdmin, validateRequest(mediaIdParamsSchema, 'params'), deleteShopMediaController);

export default router;
