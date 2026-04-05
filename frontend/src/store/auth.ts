import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '../types/admin';

interface CustomerAuthStore {
  accessToken: string | null;
  customerId: string | null;
  email: string | null;
  completeLogin: (accessToken: string, customerId: string, email?: string | null) => void;
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
      completeLogin: (accessToken, customerId, email = null) => set({ accessToken, customerId, email }),
      logout: () => set({ accessToken: null, customerId: null, email: null })
    }),
    {
      name: 'ys-customer-auth'
    }
  )
);

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
