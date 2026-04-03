function parseBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export const env = {
  enableDevFixtures: import.meta.env.DEV && parseBoolean(import.meta.env.VITE_ENABLE_DEV_FIXTURES, false),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
};
