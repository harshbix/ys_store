import { apiClient } from './client';
import type { BuildPreset, PCComponent } from '../types/api';

/**
 * Fetch all available PC build presets
 */
export async function fetchPresets() {
  const response = await apiClient.get<{ ok: boolean; data: BuildPreset[] }>('/builds/presets');
  if (!response.data.ok) {
    throw new Error(response.data.message || 'Failed to fetch presets');
  }
  return response.data.data;
}

/**
 * Fetch a single preset by ID with all its components
 */
export async function fetchPresetById(presetId: string) {
  const response = await apiClient.get<{ ok: boolean; data: BuildPreset }>(`/builds/presets/${presetId}`);
  if (!response.data.ok) {
    throw new Error(response.data.message || 'Failed to fetch preset');
  }
  return response.data.data;
}

/**
 * Fetch PC components by type (cpu, gpu, ram, motherboard, psu, case, cooler, storage)
 */
export async function fetchComponentsByType(componentType: string) {
  const response = await apiClient.get<{ ok: boolean; data: PCComponent[] }>('/builds/components', {
    params: { type: componentType }
  });
  if (!response.data.ok) {
    throw new Error(response.data.message || 'Failed to fetch components');
  }
  return response.data.data;
}

/**
 * Fetch all available component types
 */
export async function fetchComponentTypes() {
  const response = await apiClient.get<{ ok: boolean; data: string[] }>('/builds/components/types');
  if (!response.data.ok) {
    throw new Error(response.data.message || 'Failed to fetch component types');
  }
  return response.data.data;
}
