import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function normalizeApiBase(value: string): string {
        const trimmed = value.trim().replace(/\/+$/, '');
        return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

export default defineConfig(({ mode }) => {
        const env = loadEnv(mode, process.cwd(), 'VITE_');
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
                resolve: {
                        alias: {
                                '@': path.resolve(__dirname, './src')
                        }
                },
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
