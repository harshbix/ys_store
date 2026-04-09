import { useQuery } from '@tanstack/react-query';
import { fetchPresets, fetchPresetById, fetchComponentsByType, fetchComponentTypes } from '../api/pcBuilder';
import type { BuildPreset, PCComponent } from '../types/api';

const queryKeys = {
  presets: {
    all: ['pc-presets'] as const,
    detail: (id: string) => [...queryKeys.presets.all, id] as const
  },
  components: {
    all: ['pc-components'] as const,
    byType: (type: string) => [...queryKeys.components.all, type] as const,
    types: ['pc-component-types'] as const
  }
};

/**
 * Fetch all available PC build presets
 */
export function usePresetsQuery() {
  return useQuery({
    queryKey: queryKeys.presets.all,
    queryFn: () => fetchPresets(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });
}

/**
 * Fetch a single preset by ID
 */
export function usePresetQuery(presetId: string) {
  return useQuery({
    queryKey: queryKeys.presets.detail(presetId),
    queryFn: () => fetchPresetById(presetId),
    enabled: !!presetId,
    staleTime: 1000 * 60 * 5,
    retry: 2
  });
}

/**
 * Fetch PC components by type
 */
export function useComponentsQuery(componentType: string | null) {
  return useQuery({
    queryKey: queryKeys.components.byType(componentType || ''),
    queryFn: () => fetchComponentsByType(componentType || ''),
    enabled: !!componentType,
    staleTime: 1000 * 60 * 5,
    retry: 2
  });
}

/**
 * Fetch all available component types
 */
export function useComponentTypesQuery() {
  return useQuery({
    queryKey: queryKeys.components.types,
    queryFn: () => fetchComponentTypes(),
    staleTime: 1000 * 60 * 5,
    retry: 2
  });
}
