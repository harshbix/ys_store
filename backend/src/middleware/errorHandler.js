import { fail } from '../utils/apiResponse.js';

export function notFoundHandler(req, res) {
  return fail(res, 404, 'not_found', 'Route not found');
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const code = err.code || 'internal_error';
  const message = err.message || 'Unexpected server error';
  const details = err.details || null;

  return fail(res, status, code, message, details);
}
