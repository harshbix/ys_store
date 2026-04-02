import { Router } from 'express';
import { ensureGuestSession } from '../../middleware/guestSession.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import {
  buildIdParamsSchema,
  createBuildSchema,
  upsertBuildItemSchema,
  validateBuildSchema,
  buildItemParamsSchema
} from './validator.js';
import {
  createBuildController,
  getBuildController,
  upsertBuildItemController,
  deleteBuildItemController,
  validateBuildController,
  addBuildToCartController
} from './controller.js';

const router = Router();

router.use(ensureGuestSession);

router.post('/', validateRequest(createBuildSchema), createBuildController);
router.get('/:buildId', validateRequest(buildIdParamsSchema, 'params'), getBuildController);
router.patch('/:buildId/items', validateRequest(buildIdParamsSchema, 'params'), validateRequest(upsertBuildItemSchema), upsertBuildItemController);
router.delete('/:buildId/items/:itemId', validateRequest(buildItemParamsSchema, 'params'), deleteBuildItemController);
router.post('/:buildId/validate', validateRequest(buildIdParamsSchema, 'params'), validateRequest(validateBuildSchema), validateBuildController);
router.post('/:buildId/add-to-cart', validateRequest(buildIdParamsSchema, 'params'), addBuildToCartController);

export default router;
