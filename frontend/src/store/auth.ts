import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '../types/admin';

interface CustomerAuthStore {
  accessToken: string | null;
  customerId: string | null;
  email: string | null;
  authBootstrapReady: boolean;
  completeLogin: (accessToken: string, customerId: string, email?: string | null) => void;
  setAuthBootstrapReady: (ready: boolean) => void;
  logout: () => void;
}

interface AdminAuthStore {
  token: string | null;
  admin: AdminUser | null;
  setSession: (token: string, admin: AdminUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<CustomerAuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      customerId: null,
      email: null,
      authBootstrapReady: false,
      completeLogin: (accessToken, customerId, email = null) => set({ accessToken, customerId, email }),
      setAuthBootstrapReady: (ready) => set({ authBootstrapReady: ready }),
      logout: () => set({ accessToken: null, customerId: null, email: null })
    }),
    {
      name: 'ys-customer-auth'
    }
  )
);

const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAILS?.split(',').map((e: string) => e.trim().toLowerCase()) || [];

export const useIsAdmin = () => {
  const email = useAuthStore((state) => state.email);
  return email ? ADMIN_EMAILS.includes(email.toLowerCase()) : false;
};

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setSession: (token, admin) => set({ token, admin }),
      clearSession: () => set({ token: null, admin: null })
    }),
    {
      name: 'ys-admin-auth'
    }
  )
);
