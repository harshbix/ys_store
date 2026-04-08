import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function normalizeApiBase(value: string): string {
	const trimmed = value.trim().replace(/\/+$/, '');
	return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const configuredApiUrl = (env.VITE_API_URL || '').trim();
	const isRelativeApiUrl = configuredApiUrl.startsWith('/');
	const apiBase = isRelativeApiUrl
		? configuredApiUrl
		: normalizeApiBase(configuredApiUrl || 'http://localhost:4000/api');
	const proxyTarget = isRelativeApiUrl
		? 'http://localhost:4000'
		: apiBase.replace(/\/api\/?$/, '');

	return {
		plugins: [react()],
		server: {
			host: true,
			port: 5173,
			proxy: {
				'/api': {
					target: proxyTarget,
					changeOrigin: true,
					secure: true
				}
			}
		},
		preview: {
			host: true,
			port: 4173
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react';
						if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/@remix-run/')) return 'vendor-router';
						if (id.includes('node_modules/framer-motion/')) return 'vendor-motion';
						if (id.includes('node_modules/@tanstack/')) return 'vendor-query';
						if (id.includes('node_modules/@supabase/')) return 'vendor-supabase';
					}
				}
			}
		}
	};
});
