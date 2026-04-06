import { normalizeApiError } from '../lib/errors';

export function logError(error: unknown, context: string): void {
  const normalized = normalizeApiError(error);

  if (import.meta.env.DEV) {
    console.error(`[${context}]`, normalized);
  }
}

export function toUserMessage(error: unknown, fallback = 'Request failed'): string {
  const normalized = normalizeApiError(error);

  if (normalized.code === 'invalid_login_credentials' || normalized.code === 'login_failed') {
    return 'Invalid email or password.';
  }

  if (normalized.code === 'email_not_confirmed' || normalized.code === 'email_verification_required') {
    return 'Account created, but email verification is required. Please verify your email, then sign in.';
  }

  if (normalized.code === 'user_already_exists') {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (
    normalized.status === 429
    && (normalized.code === 'over_email_send_rate_limit' || normalized.code === 'register_failed')
  ) {
    return 'Too many signup attempts right now. Please wait and try again.';
  }

  return normalized.message || fallback;
}
