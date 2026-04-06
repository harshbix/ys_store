function readString(value: string | undefined): string {
  const trimmed = (value || '').trim();
  // Some hosts/users paste env values wrapped in quotes; strip one matching pair.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function isPlaceholderSupabaseUrl(value: string): boolean {
  return /your-supabase-url\.supabase\.co/i.test(value);
}

function isPlaceholderSupabaseAnonKey(value: string): boolean {
  return /your-supabase-anon-key/i.test(value);
}

function tryDecodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function isLikelyServiceRoleKey(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  if (/^sb_secret_/i.test(normalized)) return true;

  const payload = tryDecodeJwtPayload(normalized);
  const role = typeof payload?.role === 'string' ? payload.role.toLowerCase() : '';
  return role === 'service_role';
}

function isValidHttpUrl(value: string): boolean {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const env = {
  enableDevFixtures: false,
  supabaseUrl: readString(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: readString(import.meta.env.VITE_SUPABASE_ANON_KEY),
  apiUrl: readString(import.meta.env.VITE_API_URL),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD
};

export const supabaseEnvState = {
  hasUrl: Boolean(env.supabaseUrl),
  hasAnonKey: Boolean(env.supabaseAnonKey),
  hasValidUrlFormat: isValidHttpUrl(env.supabaseUrl),
  hasServiceRoleKey: isLikelyServiceRoleKey(env.supabaseAnonKey),
  hasPlaceholderUrl: isPlaceholderSupabaseUrl(env.supabaseUrl),
  hasPlaceholderAnonKey: isPlaceholderSupabaseAnonKey(env.supabaseAnonKey),
  isConfigured: Boolean(
    env.supabaseUrl
    && env.supabaseAnonKey
    && isValidHttpUrl(env.supabaseUrl)
    && !isLikelyServiceRoleKey(env.supabaseAnonKey)
    && !isPlaceholderSupabaseUrl(env.supabaseUrl)
    && !isPlaceholderSupabaseAnonKey(env.supabaseAnonKey)
  )
};
