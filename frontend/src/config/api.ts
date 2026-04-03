import { useUiStore } from '../store/ui';

const rawUrl = import.meta.env.VITE_API_URL as string | undefined;
const isProd = import.meta.env.PROD;

const DEV_API_FALLBACK = 'http://localhost:3001/api';
const PROD_API_FALLBACK = 'https://ys-store-h1ec.onrender.com/api';

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

if (!hasConfiguredApiUrl) {
  if (isProd) {
    console.error('[ENV WARNING] VITE_API_URL is missing in production. Frontend is running in degraded mode.');
    useUiStore.setState({
      apiUnavailable: true,
      apiIssueType: 'missing_env',
      apiIssueMessage: 'Service temporarily unavailable due to configuration issue.',
      apiIssueStatus: null,
      apiIssueEndpoint: null
    });
  } else {
    console.warn('[ENV WARNING] VITE_API_URL not set - using local fallback http://localhost:3001/api');
  }
}

const fallbackBase = isProd ? PROD_API_FALLBACK : DEV_API_FALLBACK;

export const API_BASE_URL = normalizeApiBaseUrl(
  hasConfiguredApiUrl ? normalizedRaw : fallbackBase
);

export const API_CONFIG = {
  mode: import.meta.env.MODE,
  isProd,
  hasConfiguredApiUrl,
  isMissingApiUrlInProd: isProd && !hasConfiguredApiUrl
} as const;

console.info('[API CONFIG]', {
  baseUrl: API_BASE_URL,
  mode: API_CONFIG.mode,
  hasConfiguredApiUrl: API_CONFIG.hasConfiguredApiUrl
});
