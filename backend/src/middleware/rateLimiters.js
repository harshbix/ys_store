import rateLimit from 'express-rate-limit';

export const quoteCreateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX_QUOTES || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error_code: 'rate_limited',
    message: 'Too many quote requests, please retry in a moment.'
  }
});

export const otpRequestLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX_OTP || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error_code: 'rate_limited',
    message: 'Too many OTP requests, please retry in a moment.'
  }
});

export const adminLoginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Math.min(Number(process.env.RATE_LIMIT_MAX_OTP || 10), 8),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error_code: 'rate_limited',
    message: 'Too many admin login attempts, please retry in a moment.'
  }
});

export const adminApiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error_code: 'rate_limited',
    message: 'Too many requests, please retry in a moment.'
  }
});
