import { apiClient } from '../lib/apiClient';
import type { BuildPreset, PCComponent } from '../types/api';

/**
 * Fetch all available PC build presets
 */
export async function fetchPresets() {
  const response = await apiClient.get('/builds/presets');
  return response.data as BuildPreset[];
}

/**
 * Fetch a single preset by ID with all its components
 */
export async function fetchPresetById(presetId: string) {
  const response = await apiClient.get(`/builds/presets/${presetId}`);
  return response.data as BuildPreset;
}

/**
 * Fetch PC components by type (cpu, gpu, ram, motherboard, psu, case, cooler, storage)
 */
export async function fetchComponentsByType(componentType: string) {
  const response = await apiClient.get('/builds/components', {
    params: { type: componentType }
  });
  return response.data as PCComponent[];
}

/**
 * Fetch all available component types
 */
export async function fetchComponentTypes() {
  const response = await apiClient.get('/builds/components/types');
  return response.data as string[];
}
