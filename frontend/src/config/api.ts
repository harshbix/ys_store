import { useUiStore } from '../store/ui';

const rawUrl = import.meta.env.VITE_API_URL as string | undefined;
const isProd = import.meta.env.PROD;

const DEV_API_FALLBACK = 'http://localhost:3001/api';

function isLoopbackHost(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  } catch {
    return false;
  }
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
const isInvalidProdLoopback = isProd && hasConfiguredApiUrl && isLoopbackHost(normalizedRaw);

if (isInvalidProdLoopback) {
  console.error('[ENV WARNING] VITE_API_URL points to localhost/loopback in production. Using Supabase as primary backend.');
}

if (!hasConfiguredApiUrl) {
  if (isProd) {
    console.error('[ENV WARNING] VITE_API_URL is missing in production. Using Supabase backend.');
  } else {
    console.warn('[ENV WARNING] VITE_API_URL not set - frontend uses Supabase directly');
  }
}

const fallbackBase = DEV_API_FALLBACK;
const resolvedBase = isInvalidProdLoopback || !hasConfiguredApiUrl
  ? fallbackBase
  : normalizedRaw;

export const API_BASE_URL = normalizeApiBaseUrl(resolvedBase);

export const API_CONFIG = {
  mode: import.meta.env.MODE,
  isProd,
  hasConfiguredApiUrl,
  isMissingApiUrlInProd: isProd && !hasConfiguredApiUrl,
  isInvalidProdLoopback
} as const;

console.info('[API CONFIG]', {
  baseUrl: API_BASE_URL,
  mode: API_CONFIG.mode,
  hasConfiguredApiUrl: API_CONFIG.hasConfiguredApiUrl
});
