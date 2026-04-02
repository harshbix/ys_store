import { Router } from 'express';
import { ensureGuestSession } from '../../middleware/guestSession.js';
import { quoteIdempotencyKey } from '../../middleware/idempotency.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { createQuoteSchema, quoteCodeParamsSchema } from './validator.js';
import {
  createQuoteController,
  getQuoteByCodeController,
  whatsappClickController,
  getWhatsappUrlController
} from './controller.js';

const router = Router();

router.use(ensureGuestSession);
router.post('/', quoteIdempotencyKey, validateRequest(createQuoteSchema), createQuoteController);
router.get('/:quoteCode', validateRequest(quoteCodeParamsSchema, 'params'), getQuoteByCodeController);
router.post('/:quoteCode/whatsapp-click', validateRequest(quoteCodeParamsSchema, 'params'), whatsappClickController);
router.get('/:quoteCode/whatsapp-url', validateRequest(quoteCodeParamsSchema, 'params'), getWhatsappUrlController);

export default router;
