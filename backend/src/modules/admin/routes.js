import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { adminLoginLimiter, adminApiLimiter } from '../../middleware/rateLimiters.js';
import {
  adminLoginSchema,
  adminProductSchema,
  productIdParamsSchema,
  quoteIdParamsSchema,
  quickEditSchema,
  stockSchema,
  visibilitySchema,
  quoteStatusSchema
} from './validator.js';
import {
  loginController,
  logoutController,
  meController,
  listProductsController,
  getProductController,
  createProductController,
  updateProductController,
  duplicateProductController,
  updateStockController,
  updateVisibilityController,
  quickEditController,
  listQuotesController,
  getQuoteController,
  updateQuoteStatusController
} from './controller.js';

const router = Router();

router.post('/login', adminLoginLimiter, validateRequest(adminLoginSchema), loginController);
router.post('/logout', adminApiLimiter, requireAdmin, logoutController);
router.get('/me', adminApiLimiter, requireAdmin, meController);

router.get('/products', adminApiLimiter, requireAdmin, listProductsController);
router.post('/products', adminApiLimiter, requireAdmin, validateRequest(adminProductSchema), createProductController);
router.get('/products/:id', adminApiLimiter, requireAdmin, validateRequest(productIdParamsSchema, 'params'), getProductController);
router.patch('/products/:id', adminApiLimiter, requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(adminProductSchema), updateProductController);
router.post('/products/:id/duplicate', adminApiLimiter, requireAdmin, validateRequest(productIdParamsSchema, 'params'), duplicateProductController);
router.patch('/products/:id/stock', adminApiLimiter, requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(stockSchema), updateStockController);
router.patch('/products/:id/visibility', adminApiLimiter, requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(visibilitySchema), updateVisibilityController);
router.patch('/products/:id/quick-edit', adminApiLimiter, requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(quickEditSchema), quickEditController);

router.get('/quotes', adminApiLimiter, requireAdmin, listQuotesController);
router.get('/quotes/:id', adminApiLimiter, requireAdmin, validateRequest(quoteIdParamsSchema, 'params'), getQuoteController);
router.patch('/quotes/:id/status', adminApiLimiter, requireAdmin, validateRequest(quoteIdParamsSchema, 'params'), validateRequest(quoteStatusSchema), updateQuoteStatusController);

export default router;
