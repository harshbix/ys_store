import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { adminLoginLimiter } from '../../middleware/rateLimiters.js';
import {
  adminLoginSchema,
  adminProductSchema,
  productIdParamsSchema,
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
router.post('/logout', requireAdmin, logoutController);
router.get('/me', requireAdmin, meController);

router.get('/products', requireAdmin, listProductsController);
router.post('/products', requireAdmin, validateRequest(adminProductSchema), createProductController);
router.get('/products/:id', requireAdmin, validateRequest(productIdParamsSchema, 'params'), getProductController);
router.patch('/products/:id', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(adminProductSchema), updateProductController);
router.post('/products/:id/duplicate', requireAdmin, validateRequest(productIdParamsSchema, 'params'), duplicateProductController);
router.patch('/products/:id/stock', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(stockSchema), updateStockController);
router.patch('/products/:id/visibility', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(visibilitySchema), updateVisibilityController);
router.patch('/products/:id/quick-edit', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(quickEditSchema), quickEditController);

router.get('/quotes', requireAdmin, listQuotesController);
router.get('/quotes/:id', requireAdmin, validateRequest(productIdParamsSchema, 'params'), getQuoteController);
router.patch('/quotes/:id/status', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(quoteStatusSchema), updateQuoteStatusController);

export default router;
