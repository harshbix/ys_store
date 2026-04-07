import { normalizeApiError } from '../lib/errors';

export function logError(error: unknown, context: string): void {
  const normalized = normalizeApiError(error);

  if (import.meta.env.DEV) {
    console.error(`[${context}]`, normalized);
  }
}

export function toUserMessage(error: unknown, fallback = 'Request failed'): string {
  const normalized = normalizeApiError(error);
  const code = (normalized.code || '').toLowerCase();
  const message = (normalized.message || '').toLowerCase();

  if (
    code === 'invalid_login_credentials'
    || code === 'invalid_credentials'
    || code === 'login_failed'
    || message.includes('invalid login credentials')
    || message.includes('invalid email or password')
  ) {
    return 'Wrong email or password. Please try again.';
  }

  if (
    code === 'email_not_confirmed'
    || code === 'email_verification_required'
    || message.includes('email not confirmed')
  ) {
    return 'Account created, but email verification is required. Please verify your email, then sign in.';
  }

  if (
    code === 'user_already_exists'
    || code === 'user_already_registered'
    || message.includes('user already registered')
    || message.includes('already exists')
  ) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (code === 'email_address_invalid' || message.includes('email address') && message.includes('invalid')) {
    return 'This email address is not valid. Please check it and try again.';
  }

  if (code === 'weak_password' || message.includes('password should be at least')) {
    return 'Password is too weak. Use at least 6 characters.';
  }

  if (
    normalized.status === 429
    && (code === 'over_email_send_rate_limit' || code === 'register_failed')
  ) {
    return 'Too many signup attempts right now. Please wait and try again.';
  }

  return normalized.message || fallback;
}
