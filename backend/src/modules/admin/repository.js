import { supabase } from '../../lib/supabase.js';

const PRODUCT_SELECT = [
  'id',
  'sku',
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
  'warranty_text',
  'is_visible',
  'is_featured',
  'featured_tag',
  'media:product_media!left(thumb_url,full_url,original_url,is_primary,sort_order)',
  'created_by_admin_id',
  'created_at',
  'updated_at'
].join(',');

const PRODUCT_SPEC_SELECT = [
  'id',
  'product_id',
  'spec_key',
  'value_text',
  'value_number',
  'value_bool',
  'value_json',
  'unit',
  'sort_order',
  'created_at'
].join(',');

const PRODUCT_MEDIA_SELECT = [
  'id',
  'product_id',
  'original_url',
  'thumb_url',
  'full_url',
  'width',
  'height',
  'size_bytes',
  'alt_text',
  'is_primary',
  'sort_order',
  'created_at'
].join(',');

const QUOTE_SELECT = [
  'id',
  'quote_code',
  'quote_type',
  'status',
  'customer_name',
  'notes',
  'estimated_total_tzs',
  'source_cart_id',
  'source_build_id',
  'idempotency_key',
  'replacement_summary',
  'whatsapp_message',
  'whatsapp_clicked_at',
  'created_at',
  'updated_at',
  'closed_reason'
].join(',');

const ANALYTICS_EVENT_SELECT = [
  'id',
  'event_name',
  'session_token',
  'customer_auth_id',
  'product_id',
  'custom_build_id',
  'quote_id',
  'page_path',
  'metadata',
  'created_at'
].join(',');

const BUILD_COMPONENT_SELECT = [
  'id',
  'type',
  'name',
  'price_tzs',
  'stock_status',
  'is_visible',
  'cpu_socket',
  'motherboard_socket',
  'motherboard_ram_type',
  'ram_type',
  'gpu_length_mm',
  'case_max_gpu_length_mm',
  'psu_wattage',
  'estimated_wattage'
].join(',');

const BUILD_PRESET_ITEM_SELECT = [
  'id',
  'preset_id',
  'slot_order',
  'component_type',
  'component_id',
  'quantity',
  'unit_price_tzs',
  'line_total_tzs',
  'created_at',
  `pc_components(${BUILD_COMPONENT_SELECT})`
].join(',');

const BUILD_PRESET_SELECT = [
  'id',
  'name',
  'cpu_family',
  'build_number',
  'subtotal_tzs',
  'discount_percent',
  'total_tzs',
  'status',
  'estimated_system_wattage',
  'required_psu_wattage',
  'compatibility_status',
  'is_visible',
  'created_at',
  'updated_at',
  `pc_build_preset_items(${BUILD_PRESET_ITEM_SELECT})`
].join(',');

export async function findAdminByEmail(email) {
  return supabase.from('admin_users').select('id, email, full_name, role, is_active, password_hash, auth_method').eq('email', email).single();
}

export async function listProductsAdmin() {
  return supabase.from('products').select(PRODUCT_SELECT).order('updated_at', { ascending: false });
}

export async function countProducts() {
  return supabase.from('products').select('id', { count: 'exact', head: true });
}

export async function countLowStockProducts() {
  return supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .in('stock_status', ['low_stock', 'sold_out']);
}

export async function countBuildPresets() {
  return supabase.from('pc_build_presets').select('id', { count: 'exact', head: true });
}

export async function countWhatsappClicks() {
  return supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .not('whatsapp_clicked_at', 'is', null);
}

export async function listRecentProducts(limit = 12) {
  return supabase
    .from('products')
    .select('id,title,slug,stock_status,is_featured,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);
}

export async function listRecentQuotes(limit = 12) {
  return supabase
    .from('quotes')
    .select('id,quote_code,status,customer_name,estimated_total_tzs,whatsapp_clicked_at,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function listRecentBuildPresets(limit = 12) {
  return supabase
    .from('pc_build_presets')
    .select('id,name,status,is_visible,total_tzs,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);
}

export async function listRecentAnalyticsEvents(limit = 80) {
  return supabase
    .from('analytics_events')
    .select(ANALYTICS_EVENT_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function listTopViewedProductEvents(limit = 600) {
  return supabase
    .from('analytics_events')
    .select('product_id,created_at')
    .eq('event_name', 'product_view')
    .not('product_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function listBuildSelectionEvents(limit = 600) {
  return supabase
    .from('analytics_events')
    .select('custom_build_id,created_at,event_name')
    .in('event_name', ['build_created', 'quote_created'])
    .not('custom_build_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function findProductsByIds(productIds) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from('products')
    .select('id,title,slug,estimated_price_tzs')
    .in('id', productIds);
}

export async function findCustomBuildsByIds(buildIds) {
  if (!Array.isArray(buildIds) || buildIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from('custom_builds')
    .select('id,build_code,name,total_estimated_price_tzs,created_at')
    .in('id', buildIds);
}

export async function findSpecDefinitionKeys() {
  return supabase.from('spec_definitions').select('spec_key');
}

export async function createProduct(payload) {
  return supabase.from('products').insert(payload).select(PRODUCT_SELECT).single();
}

export async function updateProduct(productId, payload) {
  return supabase.from('products').update(payload).eq('id', productId).select(PRODUCT_SELECT).single();
}

export async function findProductById(productId) {
  return supabase.from('products').select(PRODUCT_SELECT).eq('id', productId).maybeSingle();
}

export async function listProductSpecs(productId) {
  return supabase.from('product_specs').select(PRODUCT_SPEC_SELECT).eq('product_id', productId);
}

export async function listProductMedia(productId) {
  return supabase.from('product_media').select(PRODUCT_MEDIA_SELECT).eq('product_id', productId).order('sort_order', { ascending: true });
}

export async function replaceProductSpecs(productId, specs) {
  const del = await supabase.from('product_specs').delete().eq('product_id', productId);
  if (del.error) return del;
  if (!specs.length) return { data: [], error: null };

  return supabase.from('product_specs').insert(specs.map((s) => ({ ...s, product_id: productId })));
}

export async function listQuotesAdmin() {
  return supabase.from('quotes').select(QUOTE_SELECT).order('created_at', { ascending: false });
}

export async function updateQuoteStatus(quoteId, payload) {
  return supabase.from('quotes').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', quoteId).select(QUOTE_SELECT).single();
}

export async function listAllAuthUsers({ maxPages = 40, perPage = 200 } = {}) {
  const users = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await supabase.auth.admin.listUsers({ page, perPage });

    if (response.error) {
      // Some hosted projects can have a single malformed auth row that breaks bulk pages.
      // Retry with one-user pages and skip corrupt rows instead of failing the full dashboard.
      if (perPage > 1) {
        return listAllAuthUsers({ maxPages: Math.max(maxPages * perPage, maxPages), perPage: 1 });
      }

      if (users.length > 0) {
        console.warn('[Admin Users] Skipping unreadable auth.users page', page, response.error.message);
        continue;
      }

      return { data: null, error: response.error };
    }

    const chunk = Array.isArray(response.data?.users) ? response.data.users : [];
    users.push(...chunk);

    if (chunk.length < perPage) {
      break;
    }
  }

  return { data: users, error: null };
}

export async function listBuildPresetsAdmin() {
  return supabase
    .from('pc_build_presets')
    .select(BUILD_PRESET_SELECT)
    .order('updated_at', { ascending: false });
}

export async function findBuildPresetById(presetId) {
  return supabase
    .from('pc_build_presets')
    .select(BUILD_PRESET_SELECT)
    .eq('id', presetId)
    .maybeSingle();
}

export async function createBuildPreset(payload) {
  return supabase
    .from('pc_build_presets')
    .insert(payload)
    .select(BUILD_PRESET_SELECT)
    .single();
}

export async function updateBuildPreset(presetId, payload) {
  return supabase
    .from('pc_build_presets')
    .update(payload)
    .eq('id', presetId)
    .select(BUILD_PRESET_SELECT)
    .single();
}

export async function deleteBuildPreset(presetId) {
  return supabase
    .from('pc_build_presets')
    .delete()
    .eq('id', presetId);
}

export async function listBuildComponentsAdmin() {
  return supabase
    .from('pc_components')
    .select(BUILD_COMPONENT_SELECT)
    .order('type', { ascending: true })
    .order('name', { ascending: true });
}

export async function findBuildComponentsByIds(componentIds) {
  if (!Array.isArray(componentIds) || componentIds.length === 0) {
    return { data: [], error: null };
  }

  return supabase
    .from('pc_components')
    .select(BUILD_COMPONENT_SELECT)
    .in('id', componentIds);
}

export async function replaceBuildPresetItems(presetId, items) {
  const deleted = await supabase.from('pc_build_preset_items').delete().eq('preset_id', presetId);
  if (deleted.error) {
    return deleted;
  }

  if (!items.length) {
    return { data: [], error: null };
  }

  return supabase.from('pc_build_preset_items').insert(items.map((item) => ({ ...item, preset_id: presetId })));
}
