function readString(value: string | undefined): string {
  return (value || '').trim();
}

function isPlaceholderSupabaseUrl(value: string): boolean {
  return /your-supabase-url\.supabase\.co/i.test(value);
}

function isPlaceholderSupabaseAnonKey(value: string): boolean {
  return /your-supabase-anon-key/i.test(value);
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
  hasPlaceholderUrl: isPlaceholderSupabaseUrl(env.supabaseUrl),
  hasPlaceholderAnonKey: isPlaceholderSupabaseAnonKey(env.supabaseAnonKey),
  isConfigured: Boolean(
    env.supabaseUrl
    && env.supabaseAnonKey
    && !isPlaceholderSupabaseUrl(env.supabaseUrl)
    && !isPlaceholderSupabaseAnonKey(env.supabaseAnonKey)
  )
};
