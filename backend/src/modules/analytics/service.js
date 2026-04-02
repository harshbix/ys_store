import { insertAnalyticsEvent } from './repository.js';

export async function createEvent(payload, identity) {
  const result = await insertAnalyticsEvent({
    ...payload,
    session_token: identity.sessionToken || null,
    customer_auth_id: identity.customerAuthId || null
  });

  if (result.error) {
    throw { status: 500, code: 'analytics_insert_failed', message: result.error.message };
  }

  return { ok: true };
}
