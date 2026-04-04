import crypto from 'crypto';

// Supports client-provided key and a deterministic fallback for quote creation.
export function quoteIdempotencyKey(req, res, next) {
  const headerKey = req.headers['x-idempotency-key'] || req.headers['idempotency-key'];
  if (headerKey) {
    req.idempotencyKey = String(Array.isArray(headerKey) ? headerKey[0] : headerKey).trim();
    return next();
  }

  const src = req.body || {};
  const raw = JSON.stringify({
    source_type: src.source_type,
    source_id: src.source_id,
    customer_name: src.customer_name,
    notes: src.notes || ''
  });

  req.idempotencyKey = crypto.createHash('sha256').update(raw).digest('hex');
  return next();
}
