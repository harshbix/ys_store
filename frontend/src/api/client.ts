import axios from 'axios';
import { useStore } from '../store/useStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:10000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const { guestSessionId } = useStore.getState();
  
  if (guestSessionId) {
    config.headers['x-guest-session'] = guestSessionId;
  }
  return config;
});