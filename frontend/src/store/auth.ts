import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '../types/admin';

interface CustomerAuthStore {
  accessToken: string | null;
  customerId: string | null;
  email: string | null;
  challengeId: string | null;
  setOtpRequest: (email: string, challengeId: string) => void;
  completeLogin: (accessToken: string, customerId: string) => void;
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
      challengeId: null,
      setOtpRequest: (email, challengeId) => set({ email, challengeId }),
      completeLogin: (accessToken, customerId) => set({ accessToken, customerId }),
      logout: () => set({ accessToken: null, customerId: null, email: null, challengeId: null })
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
