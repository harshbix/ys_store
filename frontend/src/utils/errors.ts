import { normalizeApiError } from '../lib/errors';

export function logError(error: unknown, context: string): void {
  const normalized = normalizeApiError(error);

  if (import.meta.env.DEV) {
    console.error(`[${context}]`, normalized);
  }
}

export function toUserMessage(error: unknown, fallback = 'Request failed'): string {
  const normalized = normalizeApiError(error);
  return normalized.message || fallback;
}
