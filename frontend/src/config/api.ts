import { useUiStore } from '../store/ui';

const rawUrl = import.meta.env.VITE_API_URL as string | undefined;
const isProd = import.meta.env.PROD;

const DEV_API_FALLBACK = 'http://localhost:4000/api';
const PROD_API_FALLBACK = '/api';

function isLoopbackHost(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
}

function isSupabaseHost(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (/(^|\.)supabase\.(co|in)(\/|$)/i.test(normalized)) {
    return true;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return host.endsWith('.supabase.co') || host.endsWith('.supabase.in');
  } catch {
    return false;
  }
}

function isMalformedApiUrl(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;

  // Valid shapes: absolute http(s) URL or relative path starting with '/'.
  if (normalized.startsWith('/')) return false;
  if (/^https?:\/\//i.test(normalized)) return false;

  return true;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function ensureApiSuffix(value: string): string {
  if (/\/api$/i.test(value)) {
    return value;
  }

  return `${value}/api`;
}

function normalizeApiBaseUrl(value: string): string {
  return ensureApiSuffix(trimTrailingSlash(value));
}

const normalizedRaw = rawUrl?.trim() || '';
const hasConfiguredApiUrl = Boolean(normalizedRaw);
const isMalformedConfiguredApiUrl = hasConfiguredApiUrl && isMalformedApiUrl(normalizedRaw);
const isInvalidProdLoopback = isProd && hasConfiguredApiUrl && isLoopbackHost(normalizedRaw);
const isInvalidSupabaseApiUrl = hasConfiguredApiUrl && isSupabaseHost(normalizedRaw);

if (isMalformedConfiguredApiUrl) {
  console.error('[ENV WARNING] VITE_API_URL is malformed (missing protocol or leading /). Falling back to safe default.');
}

if (isInvalidProdLoopback) {
  console.error('[ENV WARNING] VITE_API_URL points to localhost/loopback in production. Falling back to relative /api.');
}

if (isInvalidSupabaseApiUrl) {
  console.error('[ENV WARNING] VITE_API_URL points to a Supabase host. Use your backend API URL instead. Falling back to relative /api.');
}

if (!hasConfiguredApiUrl) {
  if (isProd) {
    console.error('[ENV WARNING] VITE_API_URL is missing in production. Falling back to relative /api.');
  } else {
    console.warn('[ENV WARNING] VITE_API_URL not set - using local backend fallback.');
  }
}

const fallbackBase = isProd ? PROD_API_FALLBACK : DEV_API_FALLBACK;
const resolvedBase = isMalformedConfiguredApiUrl || isInvalidProdLoopback || isInvalidSupabaseApiUrl || !hasConfiguredApiUrl
  ? fallbackBase
  : normalizedRaw;

export const API_BASE_URL = normalizeApiBaseUrl(resolvedBase);

export const API_CONFIG = {
  mode: import.meta.env.MODE,
  isProd,
  hasConfiguredApiUrl,
  isMissingApiUrlInProd: isProd && !hasConfiguredApiUrl,
  isMalformedConfiguredApiUrl,
  isInvalidProdLoopback,
  isInvalidSupabaseApiUrl
} as const;

console.info('[API CONFIG]', {
  baseUrl: API_BASE_URL,
  mode: API_CONFIG.mode,
  hasConfiguredApiUrl: API_CONFIG.hasConfiguredApiUrl
});
