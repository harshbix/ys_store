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
router.post('/logout', requireAdmin, adminApiLimiter, logoutController);
router.get('/me', requireAdmin, adminApiLimiter, meController);

router.get('/products', requireAdmin, adminApiLimiter, listProductsController);
router.post('/products', requireAdmin, adminApiLimiter, validateRequest(adminProductSchema), createProductController);
router.get('/products/:id', requireAdmin, adminApiLimiter, validateRequest(productIdParamsSchema, 'params'), getProductController);
router.patch('/products/:id', requireAdmin, adminApiLimiter, validateRequest(productIdParamsSchema, 'params'), validateRequest(adminProductSchema), updateProductController);
router.post('/products/:id/duplicate', requireAdmin, adminApiLimiter, validateRequest(productIdParamsSchema, 'params'), duplicateProductController);
router.patch('/products/:id/stock', requireAdmin, adminApiLimiter, validateRequest(productIdParamsSchema, 'params'), validateRequest(stockSchema), updateStockController);
router.patch('/products/:id/visibility', requireAdmin, adminApiLimiter, validateRequest(productIdParamsSchema, 'params'), validateRequest(visibilitySchema), updateVisibilityController);
router.patch('/products/:id/quick-edit', requireAdmin, adminApiLimiter, validateRequest(productIdParamsSchema, 'params'), validateRequest(quickEditSchema), quickEditController);

router.get('/quotes', requireAdmin, adminApiLimiter, listQuotesController);
router.get('/quotes/:id', requireAdmin, adminApiLimiter, validateRequest(quoteIdParamsSchema, 'params'), getQuoteController);
router.patch('/quotes/:id/status', requireAdmin, adminApiLimiter, validateRequest(quoteIdParamsSchema, 'params'), validateRequest(quoteStatusSchema), updateQuoteStatusController);

export default router;
