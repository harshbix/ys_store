/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_ENABLE_DEV_FIXTURES?: string;
	readonly VITE_APPLE_AUTH_URL?: string;
	readonly VITE_PHONE_AUTH_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
