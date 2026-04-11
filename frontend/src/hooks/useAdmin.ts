import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminLogin,
  adminLogout,
  archiveProduct,
  createAdminBuild,
  createAdminProduct,
  deleteAdminBuild,
  getAdminActivity,
  getAdminBuildComponents,
  getAdminBuilds,
  getAdminDashboardSummary,
  getAdminUploadUrl,
  getAdminUsersSummary,
  duplicateAdminProduct,
  finalizeAdminUpload,
  getAdminMe,
  getAdminProducts,
  getAdminQuotes,
  publishProduct,
  updateAdminBuild,
  updateAdminProduct
} from '../api/admin';
import { queryKeys } from '../lib/queryKeys';
import { useAdminAuthStore } from '../store/auth';
import type {
  AdminBuildPayload,
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

  const dashboardSummaryQuery = useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => getAdminDashboardSummary(token || ''),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
    retry: 1
  });

  const usersSummaryQuery = useQuery({
    queryKey: queryKeys.admin.users(''),
    queryFn: () => getAdminUsersSummary(token || '', { limit: 20 }),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
    retry: 1
  });

  const activityQuery = useQuery({
    queryKey: queryKeys.admin.activity(40),
    queryFn: () => getAdminActivity(token || '', 40),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
    retry: 1
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.admin.products,
    queryFn: () => getAdminProducts(token || ''),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
    retry: 1
  });

  const buildsQuery = useQuery({
    queryKey: queryKeys.admin.builds,
    queryFn: () => getAdminBuilds(token || ''),
    enabled: Boolean(token),
    staleTime: 1000 * 30,
    retry: 1
  });

  const buildComponentsQuery = useQuery({
    queryKey: queryKeys.admin.buildComponents,
    queryFn: () => getAdminBuildComponents(token || ''),
    enabled: Boolean(token),
    staleTime: 1000 * 60,
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

  const createBuildMutation = useMutation({
    mutationFn: (payload: AdminBuildPayload) => createAdminBuild(payload, token || ''),
    onSuccess: async () => {
      showToast({ title: 'Build created', description: 'Preset build saved successfully.', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.builds });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
    onError: (error) => {
      showToast({
        title: 'Could not create build',
        description: toUserMessage(error, 'Please review build fields and try again.'),
        variant: 'error'
      });
    }
  });

  const updateBuildMutation = useMutation({
    mutationFn: ({ buildId, payload }: { buildId: string; payload: AdminBuildPayload }) =>
      updateAdminBuild(buildId, payload, token || ''),
    onSuccess: async () => {
      showToast({ title: 'Build updated', description: 'Preset build updated successfully.', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.builds });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
    onError: (error) => {
      showToast({
        title: 'Could not update build',
        description: toUserMessage(error, 'Please try again.'),
        variant: 'error'
      });
    }
  });

  const deleteBuildMutation = useMutation({
    mutationFn: (buildId: string) => deleteAdminBuild(buildId, token || ''),
    onSuccess: async () => {
      showToast({ title: 'Build deleted', description: 'Preset build removed.', variant: 'info' });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.builds });
      await queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
    onError: (error) => {
      showToast({
        title: 'Could not delete build',
        description: toUserMessage(error, 'Please try again.'),
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
    queryClient.removeQueries({ queryKey: queryKeys.admin.dashboard });
    queryClient.removeQueries({ queryKey: queryKeys.admin.users('') });
    queryClient.removeQueries({ queryKey: queryKeys.admin.activity(40) });
    queryClient.removeQueries({ queryKey: queryKeys.admin.products });
    queryClient.removeQueries({ queryKey: ['admin', 'product'] });
    queryClient.removeQueries({ queryKey: queryKeys.admin.builds });
    queryClient.removeQueries({ queryKey: queryKeys.admin.buildComponents });
    queryClient.removeQueries({ queryKey: queryKeys.admin.quotes });
    showToast({ title: 'Admin signed out', variant: 'info' });
  };

  return {
    token,
    admin,
    isAuthenticated: Boolean(token) && !meQuery.isError,
    emailPasswordLoginMutation,
    meQuery,
    dashboardSummaryQuery,
    usersSummaryQuery,
    activityQuery,
    productsQuery,
    buildsQuery,
    buildComponentsQuery,
    quotesQuery,
    createProductMutation,
    updateProductMutation,
    duplicateProductMutation,
    createBuildMutation,
    updateBuildMutation,
    deleteBuildMutation,
    archiveProductMutation,
    publishProductMutation,
    createUploadUrlMutation,
    finalizeUploadMutation,
    logout
  };
}

