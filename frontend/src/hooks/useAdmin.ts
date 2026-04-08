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

  /** Email/password login mutation */
  const emailPasswordLoginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => adminLogin(email, password),
    onSuccess: (data) => {
      setSession(data.token, data.admin);
      showToast({ title: 'Welcome', description: 'Admin login successful.', variant: 'success' });
    },
    onError: (error) => {
      showToast({ 
        title: 'Admin login failed', 
        description: toUserMessage(error, 'Check your email and password.'), 
        variant: 'error' 
      });
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
      showToast({ title: 'Product updated', description: `${response.title} has been updated.`, variant: 'success' });
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
        description: `${response.title} copy has been created.`,
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
    mutationFn: (productId: string) => archiveProduct(productId, token || ''),
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
    mutationFn: (productId: string) => publishProduct(productId, token || ''),
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
    mutationFn: (payload: AdminSignedUploadPayload) => getAdminUploadUrl(payload, token || '')
  });

  const finalizeUploadMutation = useMutation({
    mutationFn: (payload: AdminFinalizeUploadPayload) => finalizeAdminUpload(payload, token || '')
  });

  useEffect(() => {
    if (meQuery.data?.admin && token) {
      setSession(token, meQuery.data.admin);
    }
  }, [meQuery.data?.admin, setSession, token]);

  useEffect(() => {
    if (!token) return;
    if (meQuery.isError) {
      showToast({ title: 'Admin session expired', description: 'Please sign in again.', variant: 'error' });
      clearSession();
    }
  }, [clearSession, meQuery.isError, showToast, token]);

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
    queryClient.removeQueries({ queryKey: ['admin', 'product'] });
    queryClient.removeQueries({ queryKey: queryKeys.admin.quotes });
    showToast({ title: 'Admin signed out', variant: 'info' });
  };

  return {
    token,
    admin,
    isAuthenticated: Boolean(token) && !meQuery.isError,
    emailPasswordLoginMutation,
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

