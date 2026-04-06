import { createClient } from '@supabase/supabase-js';
import { env, supabaseEnvState } from '../utils/env';

if (!supabaseEnvState.isConfigured) {
  const reasons = [
    !supabaseEnvState.hasUrl ? 'VITE_SUPABASE_URL is missing' : null,
    !supabaseEnvState.hasAnonKey ? 'VITE_SUPABASE_ANON_KEY is missing' : null,
    (supabaseEnvState.hasUrl && !supabaseEnvState.hasValidUrlFormat)
      ? 'VITE_SUPABASE_URL must be a valid http/https URL (no angle brackets or extra quotes)'
      : null,
    supabaseEnvState.hasServiceRoleKey
      ? 'VITE_SUPABASE_ANON_KEY appears to be a service-role/secret key. Use the public anon key from Supabase Settings > API'
      : null,
    supabaseEnvState.hasPlaceholderUrl ? 'VITE_SUPABASE_URL is still set to template value' : null,
    supabaseEnvState.hasPlaceholderAnonKey ? 'VITE_SUPABASE_ANON_KEY is still set to template value' : null
  ].filter(Boolean).join('; ');

  throw new Error(
    `Supabase configuration invalid. ${reasons}. Set real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.`
  );
}

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
