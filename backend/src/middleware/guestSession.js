import crypto from 'crypto';
import { env } from '../config/env.js';

function newSessionToken() {
  return crypto.randomBytes(24).toString('hex');
}

function normalizeHeaderSessionToken(value) {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const token = String(raw || '').trim();
  if (!token) return null;

  // Allow frontend-generated guest IDs and conservative custom tokens.
  if (token.length < 8 || token.length > 128) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(token)) return null;
  return token;
}

export function ensureGuestSession(req, res, next) {
  const cookieName = env.sessionCookieName;
  const isProduction = env.nodeEnv === 'production';
  let token = req.cookies?.[cookieName];

  const headerToken = normalizeHeaderSessionToken(req.headers['x-guest-session']);

  if (!token) {
    token = headerToken || newSessionToken();
    const maxAgeMs = env.sessionCookieMaxAgeDays * 24 * 60 * 60 * 1000;

    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      maxAge: maxAgeMs
    });
  }

  req.sessionToken = token;
  return next();
}
