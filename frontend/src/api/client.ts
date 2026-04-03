import axios from 'axios';
import type { AxiosError } from 'axios';
import { useSessionStore } from '../store/session';
import { normalizeApiError } from '../lib/errors';

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error('VITE_API_URL is required. Create frontend/.env with VITE_API_URL=https://ys-store-h1ec.onrender.com/api');
}

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const { guestSessionId } = useSessionStore.getState();
  if (guestSessionId) {
    config.headers['x-guest-session'] = guestSessionId;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    return Promise.reject(normalizeApiError(error));
  }
);
