import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiBase = env.VITE_API_URL || 'https://ys-store-h1ec.onrender.com/api';
	const proxyTarget = apiBase.replace(/\/api\/?$/, '');

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
