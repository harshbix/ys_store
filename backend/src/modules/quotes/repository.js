import { supabase } from '../../lib/supabase.js';

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

const QUOTE_ITEM_SELECT = [
  'id',
  'quote_id',
  'item_type',
  'ref_product_id',
  'ref_custom_build_id',
  'title_snapshot',
  'specs_snapshot',
  'quantity',
  'unit_estimated_price_tzs',
  'line_total_tzs',
  'created_at'
].join(',');

const CART_SELECT = [
  'id',
  'session_token',
  'customer_auth_id',
  'status',
  'created_at',
  'updated_at',
  'expires_at'
].join(',');

const CART_ITEM_SELECT = [
  'id',
  'cart_id',
  'item_type',
  'product_id',
  'custom_build_id',
  'quantity',
  'unit_estimated_price_tzs',
  'title_snapshot',
  'specs_snapshot',
  'created_at'
].join(',');

const BUILD_SELECT = [
  'id',
  'build_code',
  'owner_type',
  'customer_auth_id',
  'session_token',
  'name',
  'build_status',
  'compatibility_status',
  'replacement_summary',
  'total_estimated_price_tzs',
  'is_saved',
  'created_at',
  'updated_at'
].join(',');

const BUILD_ITEM_SELECT = [
  'id',
  'custom_build_id',
  'component_type',
  'product_id',
  'quantity',
  'unit_estimated_price_tzs',
  'is_auto_replaced',
  'compatibility_notes',
  'created_at'
].join(',');

export async function findQuoteByIdempotencyKey(idempotencyKey) {
  return supabase.from('quotes').select(QUOTE_SELECT).eq('idempotency_key', idempotencyKey).maybeSingle();
}

export async function findCartWithItems(cartId) {
  const [cartRes, itemsRes] = await Promise.all([
    supabase.from('carts').select(CART_SELECT).eq('id', cartId).maybeSingle(),
    supabase.from('cart_items').select(CART_ITEM_SELECT).eq('cart_id', cartId)
  ]);
  return { cartRes, itemsRes };
}

export async function findBuildWithItems(buildId) {
  const [buildRes, itemsRes] = await Promise.all([
    supabase.from('custom_builds').select(BUILD_SELECT).eq('id', buildId).maybeSingle(),
    supabase.from('custom_build_items').select(BUILD_ITEM_SELECT).eq('custom_build_id', buildId)
  ]);
  return { buildRes, itemsRes };
}

export async function findCartById(cartId) {
  return supabase.from('carts').select(CART_SELECT).eq('id', cartId).maybeSingle();
}

export async function findBuildById(buildId) {
  return supabase.from('custom_builds').select(BUILD_SELECT).eq('id', buildId).maybeSingle();
}

export async function createQuoteAndItemsTransactional(payload) {
  return supabase.rpc('create_quote_transactional', {
    p_items: payload.p_items,
    p_quote: payload.p_quote
  });
}

export async function findQuoteByCode(quoteCode) {
  return supabase.from('quotes').select(QUOTE_SELECT).eq('quote_code', quoteCode).maybeSingle();
}

export async function findQuoteItems(quoteId) {
  return supabase.from('quote_items').select(QUOTE_ITEM_SELECT).eq('quote_id', quoteId).order('created_at', { ascending: true });
}

export async function markWhatsappClick(quoteCode) {
  return supabase
    .from('quotes')
    .update({
      status: 'whatsapp_sent',
      whatsapp_clicked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('quote_code', quoteCode)
    .in('status', ['new', 'whatsapp_sent'])
    .select(QUOTE_SELECT)
    .single();
}

export async function createAnalyticsEvent(payload) {
  return supabase.from('analytics_events').insert(payload);
}
