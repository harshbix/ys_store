import { ok, created } from '../../utils/apiResponse.js';
import { createEvent } from './service.js';

export async function trackEvent(req, res, next) {
  try {
    const data = await createEvent(req.body, {
      sessionToken: req.sessionToken,
      customerAuthId: req.customerAuthId || null
    });
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function analyticsHealth(req, res) {
  return ok(res, { module: 'analytics', status: 'ready' });
}
