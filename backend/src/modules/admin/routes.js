import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { adminLoginLimiter } from '../../middleware/rateLimiters.js';
import {
  adminBuildComponentsQuerySchema,
  adminBuildsQuerySchema,
  adminLoginSchema,
  adminActivityQuerySchema,
  adminBuildSchema,
  adminChangePasswordSchema,
  adminProductsQuerySchema,
  adminUserIdParamsSchema,
  adminUsersQuerySchema,
  adminProductSchema,
  buildPresetIdParamsSchema,
  productIdParamsSchema,
  quickEditSchema,
  stockSchema,
  visibilitySchema,
  quoteStatusSchema
} from './validator.js';
import {
  changePasswordController,
  dashboardSummaryController,
  deleteUserController,
  listUsersController,
  listActivityController,
  listBuildsController,
  listBuildComponentsController,
  createBuildController,
  updateBuildController,
  deleteBuildController,
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
  updateQuoteStatusController
} from './controller.js';

const router = Router();

router.post('/login', adminLoginLimiter, validateRequest(adminLoginSchema), loginController);
router.post('/logout', requireAdmin, logoutController);
router.get('/me', requireAdmin, meController);
router.patch('/password', requireAdmin, validateRequest(adminChangePasswordSchema), changePasswordController);

router.get('/dashboard/summary', requireAdmin, dashboardSummaryController);
router.get('/users', requireAdmin, validateRequest(adminUsersQuerySchema, 'query'), listUsersController);
router.delete('/users/:id', requireAdmin, validateRequest(adminUserIdParamsSchema, 'params'), deleteUserController);
router.get('/activity', requireAdmin, validateRequest(adminActivityQuerySchema, 'query'), listActivityController);

router.get('/builds', requireAdmin, validateRequest(adminBuildsQuerySchema, 'query'), listBuildsController);
router.get('/build-components', requireAdmin, validateRequest(adminBuildComponentsQuerySchema, 'query'), listBuildComponentsController);
router.post('/builds', requireAdmin, validateRequest(adminBuildSchema), createBuildController);
router.patch('/builds/:id', requireAdmin, validateRequest(buildPresetIdParamsSchema, 'params'), validateRequest(adminBuildSchema), updateBuildController);
router.delete('/builds/:id', requireAdmin, validateRequest(buildPresetIdParamsSchema, 'params'), deleteBuildController);

router.get('/products', requireAdmin, validateRequest(adminProductsQuerySchema, 'query'), listProductsController);
router.get('/products/:id', requireAdmin, validateRequest(productIdParamsSchema, 'params'), getProductController);
router.post('/products', requireAdmin, validateRequest(adminProductSchema), createProductController);
router.patch('/products/:id', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(adminProductSchema), updateProductController);
router.post('/products/:id/duplicate', requireAdmin, validateRequest(productIdParamsSchema, 'params'), duplicateProductController);
router.patch('/products/:id/stock', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(stockSchema), updateStockController);
router.patch('/products/:id/visibility', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(visibilitySchema), updateVisibilityController);
router.patch('/products/:id/quick-edit', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(quickEditSchema), quickEditController);

router.get('/quotes', requireAdmin, listQuotesController);
router.patch('/quotes/:id/status', requireAdmin, validateRequest(productIdParamsSchema, 'params'), validateRequest(quoteStatusSchema), updateQuoteStatusController);

export default router;
