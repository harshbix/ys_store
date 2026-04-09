import { supabase } from '../../lib/supabase.js';

/**
 * Fetch all PC build presets
 */
export async function getPresets() {
  return supabase
    .from('pc_build_presets')
    .select(`
      id,
      name,
      cpu_family,
      build_number,
      subtotal_tzs,
      discount_percent,
      total_tzs,
      status,
      estimated_system_wattage,
      required_psu_wattage,
      compatibility_status,
      is_visible,
      pc_build_preset_items(
        id,
        slot_order,
        component_type,
        component_id,
        quantity,
        unit_price_tzs,
        line_total_tzs,
        pc_components(
          id,
          type,
          name,
          price_tzs,
          cpu_socket,
          motherboard_socket,
          motherboard_ram_type,
          ram_type,
          gpu_length_mm,
          case_max_gpu_length_mm,
          psu_wattage,
          estimated_wattage
        )
      )
    `)
    .eq('is_visible', true)
    .order('build_number', { ascending: true });
}

/**
 * Fetch a single preset by ID
 */
export async function getPresetById(presetId) {
  return supabase
    .from('pc_build_presets')
    .select(`
      id,
      name,
      cpu_family,
      build_number,
      subtotal_tzs,
      discount_percent,
      total_tzs,
      status,
      estimated_system_wattage,
      required_psu_wattage,
      compatibility_status,
      pc_build_preset_items(
        id,
        slot_order,
        component_type,
        component_id,
        quantity,
        unit_price_tzs,
        pc_components(
          id,
          type,
          name,
          price_tzs,
          cpu_socket,
          motherboard_socket,
          motherboard_ram_type,
          ram_type,
          gpu_length_mm,
          case_max_gpu_length_mm,
          psu_wattage,
          estimated_wattage
        )
      )
    `)
    .eq('id', presetId)
    .single();
}

/**
 * Fetch PC components filtered by type
 */
export async function getComponentsByType(componentType) {
  return supabase
    .from('pc_components')
    .select(`
      id,
      type,
      name,
      price_tzs,
      cpu_socket,
      motherboard_socket,
      motherboard_ram_type,
      ram_type,
      gpu_length_mm,
      case_max_gpu_length_mm,
      psu_wattage,
      estimated_wattage,
      storage_capacity_gb,
      storage_type,
      ram_capacity_gb,
      vram_gb,
      cooler_type,
      cores,
      threads,
      is_visible,
      stock_status
    `)
    .eq('type', componentType)
    .eq('is_visible', true)
    .eq('stock_status', 'in_stock')
    .order('price_tzs', { ascending: true });
}

/**
 * Fetch all component types for dropdown
 */
export async function getComponentTypes() {
  const { data, error } = await supabase
    .from('pc_components')
    .select('type')
    .eq('is_visible', true)
    .eq('stock_status', 'in_stock');

  if (error) return { error, data: [] };

  // Get unique types
  const types = [...new Set(data.map(d => d.type))];
  return { data: types, error: null };
}
