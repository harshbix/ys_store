import dotenv from 'dotenv';

dotenv.config();

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_JWT_SECRET',
  'WHATSAPP_PHONE_E164'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:4000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  adminJwtSecret: process.env.ADMIN_JWT_SECRET,
  adminJwtExpiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  whatsappPhoneE164: process.env.WHATSAPP_PHONE_E164,
  otpProvider: process.env.OTP_PROVIDER || 'supabase',
  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS || 300),
  sessionCookieName: process.env.SESSION_COOKIE_NAME || 'ys_session',
  sessionCookieMaxAgeDays: Number(process.env.SESSION_COOKIE_MAX_AGE_DAYS || 30)
};
