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
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && status >= 500 ? 'Unexpected server error' : (err.message || 'Unexpected server error');
  const details = isProd ? null : (err.details || null);

  return fail(res, status, code, message, {
    details,
    request_id: req.requestId || null
  });
}
