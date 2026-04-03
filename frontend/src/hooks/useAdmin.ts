import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminLogin, adminLogout, getAdminMe, getAdminProducts, getAdminQuotes } from '../api/admin';
import { queryKeys } from '../lib/queryKeys';
import { useAdminAuthStore } from '../store/auth';
import { toUserMessage } from '../utils/errors';
import { useShowToast } from './useToast';

export function useAdmin() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();

  const token = useAdminAuthStore((state) => state.token);
  const admin = useAdminAuthStore((state) => state.admin);
  const setSession = useAdminAuthStore((state) => state.setSession);
  const clearSession = useAdminAuthStore((state) => state.clearSession);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => adminLogin(email, password),
    onSuccess: async (response) => {
      setSession(response.data.token, response.data.admin);
      showToast({ title: 'Admin access granted', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.me });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.quotes });
    },
    onError: (error) => {
      showToast({ title: 'Admin login failed', description: toUserMessage(error, 'Check admin credentials and retry.'), variant: 'error' });
    }
  });

  const meQuery = useQuery({
    queryKey: queryKeys.admin.me,
    queryFn: () => getAdminMe(token || ''),
    enabled: Boolean(token),
    staleTime: 1000 * 60,
    retry: 0
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.admin.products,
    queryFn: () => getAdminProducts(token || ''),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
    retry: 1
  });

  const quotesQuery = useQuery({
    queryKey: queryKeys.admin.quotes,
    queryFn: () => getAdminQuotes(token || ''),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
    retry: 1
  });

  useEffect(() => {
    if (meQuery.data?.data.admin && token) {
      setSession(token, meQuery.data.data.admin);
    }
  }, [meQuery.data?.data.admin, setSession, token]);

  useEffect(() => {
    if (!token) return;
    if (meQuery.isError) {
      clearSession();
    }
  }, [clearSession, meQuery.isError, token]);

  const logout = async () => {
    try {
      if (token) {
        await adminLogout(token);
      }
    } catch {
      // Ignore logout network errors and clear local session regardless.
    }

    clearSession();
    queryClient.removeQueries({ queryKey: queryKeys.admin.me });
    queryClient.removeQueries({ queryKey: queryKeys.admin.products });
    queryClient.removeQueries({ queryKey: queryKeys.admin.quotes });
    showToast({ title: 'Admin signed out', variant: 'info' });
  };

  return {
    token,
    admin,
    isAuthenticated: Boolean(token),
    loginMutation,
    meQuery,
    productsQuery,
    quotesQuery,
    logout
  };
}
