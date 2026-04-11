import { supabase } from '../../lib/supabase.js';

const SITEMAP_PRODUCT_SELECT = 'id,slug,created_at,updated_at';
const SITEMAP_BUILD_SELECT = 'id,created_at,updated_at';

const PRODUCT_MARKDOWN_SELECT = [
  'id',
  'slug',
  'title',
  'product_type',
  'brand',
  'model_name',
  'condition',
  'stock_status',
  'estimated_price_tzs',
  'short_description',
  'long_description',
  'is_visible',
  'created_at',
  'updated_at'
].join(',');

const PRODUCT_SPEC_MARKDOWN_SELECT = [
  'id',
  'spec_key',
  'value_text',
  'value_number',
  'value_bool',
  'unit',
  'sort_order'
].join(',');

const BUILD_MARKDOWN_SELECT = [
  'id',
  'name',
  'cpu_family',
  'total_tzs',
  'status',
  'compatibility_status',
  'estimated_system_wattage',
  'required_psu_wattage',
  'is_visible',
  'created_at',
  'updated_at',
  [
    'pc_build_preset_items(',
    'id,',
    'slot_order,',
    'component_type,',
    'component_id,',
    'quantity,',
    'unit_price_tzs,',
    'line_total_tzs,',
    'pc_components(id,type,name,price_tzs,estimated_wattage)',
    ')'
  ].join('')
].join(',');

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

export async function listVisibleProductsForSitemap(limit) {
  return supabase
    .from('products')
    .select(SITEMAP_PRODUCT_SELECT)
    .eq('is_visible', true)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(limit);
}

export async function listVisibleBuildPresetsForSitemap(limit) {
  return supabase
    .from('pc_build_presets')
    .select(SITEMAP_BUILD_SELECT)
    .eq('is_visible', true)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(limit);
}

export async function findVisibleProductByIdentifier(identifier) {
  const slugResult = await supabase
    .from('products')
    .select(PRODUCT_MARKDOWN_SELECT)
    .eq('slug', identifier)
    .eq('is_visible', true)
    .maybeSingle();

  if (slugResult.error || slugResult.data || !isUuidLike(identifier)) {
    return slugResult;
  }

  return supabase
    .from('products')
    .select(PRODUCT_MARKDOWN_SELECT)
    .eq('id', identifier)
    .eq('is_visible', true)
    .maybeSingle();
}

export async function listProductSpecsForMarkdown(productId) {
  return supabase
    .from('product_specs')
    .select(PRODUCT_SPEC_MARKDOWN_SELECT)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .limit(120);
}

export async function findVisibleBuildPresetByIdentifier(identifier) {
  return supabase
    .from('pc_build_presets')
    .select(BUILD_MARKDOWN_SELECT)
    .eq('id', identifier)
    .eq('is_visible', true)
    .maybeSingle();
}
