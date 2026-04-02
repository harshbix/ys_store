import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/apiResponse.js';

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return fail(res, 401, 'unauthorized', 'Missing admin token');
  }

  try {
    const payload = jwt.verify(token, env.adminJwtSecret);
    if (payload.role !== 'owner') {
      return fail(res, 403, 'forbidden', 'Insufficient admin role');
    }
    req.admin = payload;
    return next();
  } catch (err) {
    return fail(res, 401, 'unauthorized', 'Invalid admin token');
  }
}
