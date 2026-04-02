import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/apiResponse.js';

export function requireCustomerAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return fail(res, 401, 'unauthorized', 'Customer login required');

  try {
    const payload = jwt.verify(token, env.adminJwtSecret);
    if (payload.type !== 'customer') return fail(res, 401, 'unauthorized', 'Invalid customer token');
    req.customerAuthId = payload.sub;
    return next();
  } catch {
    return fail(res, 401, 'unauthorized', 'Invalid customer token');
  }
}
