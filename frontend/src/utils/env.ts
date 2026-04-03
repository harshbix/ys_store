function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function normalizeApiUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return undefined;

  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

export const env = {
  apiUrl: normalizeApiUrl(import.meta.env.VITE_API_URL as string | undefined),
  enableDevFixtures: import.meta.env.DEV && parseBoolean(import.meta.env.VITE_ENABLE_DEV_FIXTURES, false),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
};
