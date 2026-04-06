import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminLogin,
  adminLogout,
  archiveProduct,
  createAdminProduct,
  getAdminUploadUrl,
  duplicateAdminProduct,
  finalizeAdminUpload,
  getAdminMe,
  getAdminProducts,
  getAdminQuotes,
  publishProduct,
  updateAdminProduct
} from '../api/admin';
import { queryKeys } from '../lib/queryKeys';
import { useAdminAuthStore } from '../store/auth';
import type {
  AdminFinalizeUploadPayload,
  AdminProductPayload,
  AdminSignedUploadPayload
} from '../types/admin';
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

  const createProductMutation = useMutation({
    mutationFn: (payload: AdminProductPayload) => createAdminProduct(payload, token || ''),
    onSuccess: async () => {
      showToast({ title: 'Product saved', description: 'Your new product is now available in the admin catalog.', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
    },
    onError: (error) => {
      showToast({
        title: 'Could not save product',
        description: toUserMessage(error, 'Please check the product details and try again.'),
        variant: 'error'
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, payload }: { productId: string; payload: AdminProductPayload }) =>
      updateAdminProduct(productId, payload, token || ''),
    onSuccess: async (response, variables) => {
      showToast({ title: 'Product updated', description: `${response.data.title} has been updated.`, variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.productDetail(variables.productId) });
    },
    onError: (error) => {
      showToast({
        title: 'Could not update product',
        description: toUserMessage(error, 'Your changes were not saved. Please try again.'),
        variant: 'error'
      });
    }
  });

  const duplicateProductMutation = useMutation({
    mutationFn: (productId: string) => duplicateAdminProduct(productId, token || ''),
    onSuccess: async (response) => {
      showToast({
        title: 'Product duplicated',
        description: `${response.data.title} copy has been created.`,
        variant: 'success'
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
    },
    onError: (error) => {
      showToast({
        title: 'Could not duplicate product',
        description: toUserMessage(error, 'Try again in a moment.'),
        variant: 'error'
      });
    }
  });

  const archiveProductMutation = useMutation({
    mutationFn: (productId: string) => archiveProduct(productId),
    onSuccess: async (response, productId) => {
      showToast({ title: 'Product archived', description: `${response.title} is now hidden from customers.`, variant: 'info' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.productDetail(productId) });
    },
    onError: (error) => {
      showToast({
        title: 'Could not archive product',
        description: toUserMessage(error, 'Please try again.'),
        variant: 'error'
      });
    }
  });

  const publishProductMutation = useMutation({
    mutationFn: (productId: string) => publishProduct(productId),
    onSuccess: async (response, productId) => {
      showToast({ title: 'Product published', description: `${response.title} is now visible to customers.`, variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.products });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.productDetail(productId) });
    },
    onError: (error) => {
      showToast({
        title: 'Could not publish product',
        description: toUserMessage(error, 'Please try again.'),
        variant: 'error'
      });
    }
  });

  const createUploadUrlMutation = useMutation({
    mutationFn: (payload: AdminSignedUploadPayload) => getAdminUploadUrl(payload)
  });

  const finalizeUploadMutation = useMutation({
    mutationFn: (payload: AdminFinalizeUploadPayload) => finalizeAdminUpload(payload)
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
        await adminLogout();
      }
    } catch {
      // Ignore logout network errors and clear local session regardless.
    }

    clearSession();
    queryClient.removeQueries({ queryKey: queryKeys.admin.me });
    queryClient.removeQueries({ queryKey: queryKeys.admin.products });
    queryClient.removeQueries({ queryKey: ['admin', 'product'] });
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
    createProductMutation,
    updateProductMutation,
    duplicateProductMutation,
    archiveProductMutation,
    publishProductMutation,
    createUploadUrlMutation,
    finalizeUploadMutation,
    logout
  };
}
