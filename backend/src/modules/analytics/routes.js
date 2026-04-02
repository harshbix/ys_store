import { Router } from 'express';
import { ensureGuestSession } from '../../middleware/guestSession.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { analyticsEventSchema } from './validator.js';
import { trackEvent, analyticsHealth } from './controller.js';

const router = Router();

router.use(ensureGuestSession);
router.get('/health', analyticsHealth);
router.post('/events', validateRequest(analyticsEventSchema), trackEvent);

export default router;
