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
		: normalizeApiBase(configuredApiUrl || 'https://ys-store-h1ec.onrender.com/api');
	const proxyTarget = isRelativeApiUrl
		? 'https://ys-store-h1ec.onrender.com'
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
		}
	};
});
