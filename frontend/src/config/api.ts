const rawUrl = import.meta.env.VITE_API_URL as string | undefined;

const LOCAL_API_FALLBACK = 'http://localhost:3001';

if (!rawUrl) {
  console.warn('[ENV WARNING] VITE_API_URL not set - using fallback');
  console.warn('[API] Missing VITE_API_URL - falling back to localhost');
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export const API_BASE_URL = rawUrl?.trim()
  ? trimTrailingSlash(rawUrl.trim())
  : LOCAL_API_FALLBACK;

console.info('[API CONFIG]', {
  baseUrl: API_BASE_URL,
  env: import.meta.env.MODE
});
