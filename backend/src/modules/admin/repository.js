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

export async function findAdminByEmail(email) {
  return supabase.from('admin_users').select('id, email, full_name, role, is_active').eq('email', email).single();
}

export async function listProductsAdmin() {
  return supabase.from('products').select(PRODUCT_SELECT).order('updated_at', { ascending: false });
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
