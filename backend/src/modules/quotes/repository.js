import { supabase } from '../../lib/supabase.js';

export async function findQuoteByIdempotencyKey(idempotencyKey) {
  return supabase.from('quotes').select('*').eq('idempotency_key', idempotencyKey).maybeSingle();
}

export async function findCartWithItems(cartId) {
  const [cartRes, itemsRes] = await Promise.all([
    supabase.from('carts').select('*').eq('id', cartId).maybeSingle(),
    supabase.from('cart_items').select('*').eq('cart_id', cartId)
  ]);
  return { cartRes, itemsRes };
}

export async function findBuildWithItems(buildId) {
  const [buildRes, itemsRes] = await Promise.all([
    supabase.from('custom_builds').select('*').eq('id', buildId).maybeSingle(),
    supabase.from('custom_build_items').select('*').eq('custom_build_id', buildId)
  ]);
  return { buildRes, itemsRes };
}

export async function createQuoteAndItemsTransactional(payload) {
  // Safest MVP-compatible option: use a SQL function/RPC for true transaction semantics.
  // This RPC must insert into quotes and quote_items atomically and return the quote row.
  return supabase.rpc('create_quote_transactional', payload);
}

export async function findQuoteByCode(quoteCode) {
  return supabase.from('quotes').select('*').eq('quote_code', quoteCode).maybeSingle();
}

export async function findQuoteItems(quoteId) {
  return supabase.from('quote_items').select('*').eq('quote_id', quoteId).order('created_at', { ascending: true });
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
    .select()
    .single();
}

export async function createAnalyticsEvent(payload) {
  return supabase.from('analytics_events').insert(payload);
}
