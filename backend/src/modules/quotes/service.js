import {
  findQuoteByIdempotencyKey,
  findCartWithItems,
  findBuildWithItems,
  findCartById,
  findBuildById,
  createQuoteAndItemsTransactional,
  findQuoteByCode,
  findQuoteItems,
  markWhatsappClick,
  createAnalyticsEvent
} from './repository.js';
import { generateQuoteCode } from '../../utils/quoteCode.js';
import { formatWhatsAppMessage, generateWhatsAppUrl } from '../../utils/whatsapp.js';

function inferQuoteType(payload, items) {
  if (payload.quote_type) return payload.quote_type;
  if (payload.source_type === 'build') return 'build';
  if (items.some((i) => /laptop/i.test(i.title_snapshot || ''))) return 'laptop';
  if (items.some((i) => /desktop/i.test(i.title_snapshot || ''))) return 'desktop';
  return 'general';
}

function isOwnedByIdentity(row, identity) {
  if (!row) return false;
  if (identity.sessionToken && row.session_token && row.session_token === identity.sessionToken) return true;
  if (identity.customerAuthId && row.customer_auth_id && row.customer_auth_id === identity.customerAuthId) return true;
  return false;
}

export async function createQuote(payload, identity) {
  const existing = await findQuoteByIdempotencyKey(payload.idempotency_key);
  if (existing.error) throw { status: 500, code: 'quote_idempotency_failed', message: existing.error.message };
  if (existing.data) {
    const msg = existing.data.whatsapp_message;
    const wa = generateWhatsAppUrl(msg);
    return { ...existing.data, whatsapp_url: wa.url, whatsapp_meta: wa };
  }

  let items = [];
  let estimatedTotal = 0;
  let replacementSummary = null;

  if (payload.source_type === 'cart') {
    const { cartRes, itemsRes } = await findCartWithItems(payload.source_id);
    if (cartRes.error || !cartRes.data) throw { status: 404, code: 'cart_not_found', message: 'Cart not found' };
    if (!isOwnedByIdentity(cartRes.data, identity)) throw { status: 404, code: 'cart_not_found', message: 'Cart not found' };
    if (itemsRes.error) throw { status: 500, code: 'cart_items_failed', message: itemsRes.error.message };

    items = (itemsRes.data || []).map((i) => ({
      item_type: i.item_type,
      ref_product_id: i.product_id,
      ref_custom_build_id: i.custom_build_id,
      title_snapshot: i.title_snapshot,
      specs_snapshot: i.specs_snapshot,
      quantity: i.quantity,
      unit_estimated_price_tzs: i.unit_estimated_price_tzs,
      line_total_tzs: i.quantity * i.unit_estimated_price_tzs
    }));
  } else {
    const { buildRes, itemsRes } = await findBuildWithItems(payload.source_id);
    if (buildRes.error || !buildRes.data) throw { status: 404, code: 'build_not_found', message: 'Build not found' };
    if (!isOwnedByIdentity(buildRes.data, identity)) throw { status: 404, code: 'build_not_found', message: 'Build not found' };
    if (itemsRes.error) throw { status: 500, code: 'build_items_failed', message: itemsRes.error.message };

    replacementSummary = buildRes.data.replacement_summary;
    const buildTitle = buildRes.data.name || 'Custom Build';
    const buildLineTotal = Number(buildRes.data.total_estimated_price_tzs || 0);

    items = [{
      item_type: 'custom_build',
      ref_product_id: null,
      ref_custom_build_id: buildRes.data.id,
      title_snapshot: buildTitle,
      specs_snapshot: {
        components: itemsRes.data || [],
        replacement_summary: replacementSummary
      },
      quantity: 1,
      unit_estimated_price_tzs: buildLineTotal,
      line_total_tzs: buildLineTotal
    }];
  }

  estimatedTotal = items.reduce((acc, i) => acc + i.line_total_tzs, 0);
  const quoteType = inferQuoteType(payload, items);
  const quoteCode = generateQuoteCode(quoteType);

  const message = formatWhatsAppMessage({
    quoteCode,
    customerName: payload.customer_name,
    items,
    estimatedTotalTzs: estimatedTotal,
    notes: payload.notes
  });

  const txPayload = {
    p_quote: {
      quote_code: quoteCode,
      quote_type: quoteType,
      customer_name: payload.customer_name,
      notes: payload.notes || null,
      estimated_total_tzs: estimatedTotal,
      source_cart_id: payload.source_type === 'cart' ? payload.source_id : null,
      source_build_id: payload.source_type === 'build' ? payload.source_id : null,
      idempotency_key: payload.idempotency_key,
      replacement_summary: replacementSummary,
      whatsapp_message: message
    },
    p_items: items
  };

  const tx = await createQuoteAndItemsTransactional(txPayload);
  if (tx.error) throw { status: 500, code: 'quote_create_failed', message: tx.error.message, details: 'create_quote_transactional missing or failed' };

  const quote = Array.isArray(tx.data)
    ? tx.data[0]
    : (tx.data && tx.data.id ? tx.data : tx.data);

  if (!quote || !quote.id) {
    throw { status: 500, code: 'quote_create_failed', message: 'Transactional quote RPC returned invalid payload' };
  }

  await createAnalyticsEvent({
    event_name: 'quote_created',
    session_token: identity.sessionToken,
    quote_id: quote.id,
    metadata: {
      quote_code: quote.quote_code,
      quote_type: quote.quote_type,
      items_count: items.length,
      estimated_total_tzs: estimatedTotal
    }
  });

  const wa = generateWhatsAppUrl(message);
  return { ...quote, whatsapp_url: wa.url, whatsapp_meta: wa };
}

export async function getQuote(quoteCode) {
  const quoteRes = await findQuoteByCode(quoteCode);
  if (quoteRes.error) throw { status: 500, code: 'quote_lookup_failed', message: quoteRes.error.message };
  if (!quoteRes.data) throw { status: 404, code: 'quote_not_found', message: 'Quote not found' };

  const itemsRes = await findQuoteItems(quoteRes.data.id);
  if (itemsRes.error) throw { status: 500, code: 'quote_items_failed', message: itemsRes.error.message };

  return { ...quoteRes.data, items: itemsRes.data || [] };
}

export async function trackWhatsappClick(quoteCode, identity) {
  const quoteRes = await findQuoteByCode(quoteCode);
  if (quoteRes.error) throw { status: 500, code: 'quote_lookup_failed', message: quoteRes.error.message };
  if (!quoteRes.data) throw { status: 404, code: 'quote_not_found', message: 'Quote not found' };

  if (quoteRes.data.source_cart_id) {
    const cartRes = await findCartById(quoteRes.data.source_cart_id);
    if (cartRes.error) throw { status: 500, code: 'cart_lookup_failed', message: cartRes.error.message };
    if (!cartRes.data || !isOwnedByIdentity(cartRes.data, identity)) {
      throw { status: 404, code: 'quote_not_found', message: 'Quote not found' };
    }
  }

  if (quoteRes.data.source_build_id) {
    const buildRes = await findBuildById(quoteRes.data.source_build_id);
    if (buildRes.error) throw { status: 500, code: 'build_lookup_failed', message: buildRes.error.message };
    if (!buildRes.data || !isOwnedByIdentity(buildRes.data, identity)) {
      throw { status: 404, code: 'quote_not_found', message: 'Quote not found' };
    }
  }

  const updated = await markWhatsappClick(quoteCode);
  if (updated.error) throw { status: 500, code: 'whatsapp_click_failed', message: updated.error.message };

  await Promise.all([
    createAnalyticsEvent({
      event_name: 'whatsapp_click_initiated',
      session_token: identity.sessionToken,
      quote_id: updated.data.id,
      metadata: { quote_code: quoteCode }
    }),
    createAnalyticsEvent({
      event_name: 'whatsapp_click',
      session_token: identity.sessionToken,
      quote_id: updated.data.id,
      metadata: { quote_code: quoteCode }
    })
  ]);

  return updated.data;
}
