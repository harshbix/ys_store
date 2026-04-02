import crypto from 'crypto';
import { env } from '../config/env.js';

function newSessionToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function ensureGuestSession(req, res, next) {
  const cookieName = env.sessionCookieName;
  let token = req.cookies?.[cookieName];

  if (!token) {
    token = newSessionToken();
    const maxAgeMs = env.sessionCookieMaxAgeDays * 24 * 60 * 60 * 1000;

    res.cookie(cookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: maxAgeMs
    });
  }

  req.sessionToken = token;
  return next();
}
