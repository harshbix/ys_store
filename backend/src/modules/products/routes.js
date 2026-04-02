import { Router } from 'express';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  listProductsQuerySchema,
  productSlugParamsSchema,
  filterOptionsQuerySchema,
  compareBodySchema
} from './validator.js';
import {
  listProducts,
  getProductBySlug,
  getFilterOptionsController,
  compareProductsController
} from './controller.js';

const router = Router();

router.get('/', validateRequest(listProductsQuerySchema, 'query'), listProducts);
router.get('/filters/options', validateRequest(filterOptionsQuerySchema, 'query'), getFilterOptionsController);
router.post('/compare', validateRequest(compareBodySchema), compareProductsController);
router.get('/:slug', validateRequest(productSlugParamsSchema, 'params'), getProductBySlug);

export default router;
