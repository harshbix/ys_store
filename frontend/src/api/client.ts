import axios from 'axios';
import type { AxiosError } from 'axios';
import { useSessionStore } from '../store/session';
import { useAdminAuthStore, useAuthStore } from '../store/auth';
import { normalizeApiError } from '../lib/errors';
import { env } from '../utils/env';

const configuredBaseURL = env.apiUrl;
const baseURL = import.meta.env.DEV ? '/api' : configuredBaseURL;

if (!baseURL) {
  throw new Error('VITE_API_URL is required. Set frontend/.env VITE_API_URL=https://ys-store-h1ec.onrender.com');
}

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const { guestSessionId } = useSessionStore.getState();
  if (guestSessionId) {
    config.headers['x-guest-session'] = guestSessionId;
  }

  const customerToken = useAuthStore.getState().accessToken;
  const adminToken = useAdminAuthStore.getState().token;
  const hasAuthHeader = Boolean(config.headers.Authorization);
  const url = config.url || '';

  if (!hasAuthHeader) {
    if (adminToken && url.startsWith('/admin')) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (customerToken && url.startsWith('/auth')) {
      config.headers.Authorization = `Bearer ${customerToken}`;
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(normalizeApiError(error));
  }
);
