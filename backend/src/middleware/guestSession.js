import crypto from 'crypto';
import { env } from '../config/env.js';

function newSessionToken() {
  return crypto.randomBytes(24).toString('hex');
}

export function ensureGuestSession(req, res, next) {
  const cookieName = env.sessionCookieName;
  const isProduction = env.nodeEnv === 'production';
  let token = req.cookies?.[cookieName];

  if (!token) {
    token = newSessionToken();
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
