import { normalizeApiError } from '../lib/errors';

export function logError(error: unknown, context: string): void {
  const normalized = normalizeApiError(error);

  if (import.meta.env.DEV) {
    console.error(`[${context}]`, normalized);
  }
}

export function toUserMessage(error: unknown, fallback = 'Request failed'): string {
  const normalized = normalizeApiError(error);

  if (
    normalized.status === 429
    && (normalized.code === 'over_email_send_rate_limit' || normalized.code === 'register_failed')
  ) {
    return 'Too many signup attempts right now. Please wait and try again.';
  }

  return normalized.message || fallback;
}
