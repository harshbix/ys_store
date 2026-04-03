const GUEST_PREFIX = 'guest_live_';

export function generateGuestSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${GUEST_PREFIX}${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
  }

  const fallback = Math.random().toString(36).slice(2, 22);
  return `${GUEST_PREFIX}${fallback}`;
}

export function generateIdempotencyKey(prefix = 'quote'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID().replace(/-/g, '')}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}
