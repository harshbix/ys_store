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
import {
  listPresetsController,
  getPresetController,
  listComponentsController,
  listComponentTypesController
} from './pcBuilderController.js';

const router = Router();

// Public PC Builder data endpoints (no auth required)
router.get('/presets', listPresetsController);
router.get('/presets/:presetId', getPresetController);
router.get('/components/types', listComponentTypesController);
router.get('/components', listComponentsController);

// Custom build endpoints (require guest session)
router.use(ensureGuestSession);

router.post('/', validateRequest(createBuildSchema), createBuildController);
router.get('/:buildId', validateRequest(buildIdParamsSchema, 'params'), getBuildController);
router.patch('/:buildId/items', validateRequest(buildIdParamsSchema, 'params'), validateRequest(upsertBuildItemSchema), upsertBuildItemController);
router.delete('/:buildId/items/:itemId', validateRequest(buildItemParamsSchema, 'params'), deleteBuildItemController);
router.post('/:buildId/validate', validateRequest(buildIdParamsSchema, 'params'), validateRequest(validateBuildSchema), validateBuildController);
router.post('/:buildId/add-to-cart', validateRequest(buildIdParamsSchema, 'params'), addBuildToCartController);

export default router;
