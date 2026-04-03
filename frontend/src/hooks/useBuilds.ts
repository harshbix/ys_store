import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addBuildToCart,
  createBuild,
  deleteBuildItem,
  getBuild,
  upsertBuildItem,
  validateBuild,
  type UpsertBuildItemBody
} from '../api/builds';
import { normalizeApiError } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { useSessionStore } from '../store/session';
import { useShowToast } from './useToast';

export function useBuilds() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();
  const activeBuildId = useSessionStore((state) => state.activeBuildId);
  const setActiveBuildId = useSessionStore((state) => state.setActiveBuildId);

  const buildQuery = useQuery({
    queryKey: queryKeys.builds.detail(activeBuildId || ''),
    queryFn: () => getBuild(activeBuildId || ''),
    enabled: Boolean(activeBuildId),
    staleTime: 1000 * 10,
    retry: 1
  });

  const createBuildMutation = useMutation({
    mutationFn: () => createBuild({ name: 'My Custom Build' }),
    onSuccess: (response) => {
      setActiveBuildId(response.data.id);
      showToast({ title: 'Build started', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.builds.detail(response.data.id) });
    },
    onError: () => {
      showToast({ title: 'Unable to create build', variant: 'error' });
    }
  });

  const ensureBuild = useCallback(async (): Promise<string> => {
    if (activeBuildId) {
      const cachedBuild = queryClient.getQueryData(queryKeys.builds.detail(activeBuildId));
      if (cachedBuild) {
        return activeBuildId;
      }

      try {
        await getBuild(activeBuildId);
        return activeBuildId;
      } catch (error) {
        const normalized = normalizeApiError(error);
        if (normalized.status !== 404) {
          throw error;
        }

        setActiveBuildId(null);
      }
    }

    if (createBuildMutation.isPending) return '';
    const response = await createBuildMutation.mutateAsync();
    return response.data.id;
  }, [activeBuildId, createBuildMutation.isPending, createBuildMutation.mutateAsync, queryClient, setActiveBuildId]);

  const invalidateBuild = async (buildId: string) => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.builds.detail(buildId) });
  };

  const upsertItemMutation = useMutation({
    mutationFn: async ({ buildId, body }: { buildId: string; body: UpsertBuildItemBody }) => {
      return upsertBuildItem(buildId, body);
    },
    onSuccess: (_data, variables) => {
      showToast({ title: 'Component updated', variant: 'success' });
      void invalidateBuild(variables.buildId);
    },
    onError: () => {
      showToast({ title: 'Could not update component', variant: 'error' });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ buildId, itemId }: { buildId: string; itemId: string }) => deleteBuildItem(buildId, itemId),
    onSuccess: (_data, variables) => {
      showToast({ title: 'Component removed', variant: 'info' });
      void invalidateBuild(variables.buildId);
    },
    onError: () => {
      showToast({ title: 'Unable to remove component', variant: 'error' });
    }
  });

  const validateMutation = useMutation({
    mutationFn: ({ buildId, autoReplace }: { buildId: string; autoReplace: boolean }) =>
      validateBuild(buildId, { auto_replace: autoReplace }),
    onError: () => {
      showToast({ title: 'Validation failed', description: 'Please retry in a moment.', variant: 'error' });
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: (buildId: string) => addBuildToCart(buildId),
    onSuccess: () => {
      showToast({ title: 'Build added to cart', variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
    },
    onError: () => {
      showToast({ title: 'Could not add build to cart', variant: 'error' });
    }
  });

  return {
    activeBuildId,
    setActiveBuildId,
    buildQuery,
    ensureBuild,
    createBuildMutation,
    upsertItemMutation,
    deleteItemMutation,
    validateMutation,
    addToCartMutation
  };
}
