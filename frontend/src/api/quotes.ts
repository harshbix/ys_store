import { supabase } from '../lib/supabase';
import { getCart, getSessionContext } from './cart';
import type { QuoteDetail, QuoteRecord, QuoteType } from '../types/api';
import { env } from '../utils/env';
import { logError } from '../utils/errors';

export interface CreateQuoteBody {
  customer_name: string;
  notes?: string;
  source_type: 'cart' | 'build';
  source_id: string;
  quote_type?: QuoteType;
  idempotency_key?: string;
}

const fixtureQuoteStorageKey = 'ys-dev-fixture-quotes';
const WHATSAPP_PHONE_E164 = '255628662932';

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `fix-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildFixtureQuoteCode(): string {
  return `QF-${String(Date.now()).slice(-6)}`;
}

function buildWhatsappUrl(quoteCode: string): string {
  const message = `Hello, I am following up on quote ${quoteCode}.`;
  return `https://wa.me/${WHATSAPP_PHONE_E164}?text=${encodeURIComponent(message)}`;
}

function loadFixtureQuotes(): QuoteDetail[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(fixtureQuoteStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuoteDetail[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFixtureQuotes(quotes: QuoteDetail[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(fixtureQuoteStorageKey, JSON.stringify(quotes));
}

export async function createQuote(body: CreateQuoteBody, idempotencyKey?: string): Promise<any> {
  try {
    await getSessionContext();
    const idempotency = idempotencyKey || body.idempotency_key || crypto.randomUUID();
    
    const { data, error } = await supabase.rpc('create_quote_from_cart', {
      p_customer_name: body.customer_name,
      p_notes: body.notes || null,
      p_source_type: body.source_type,
      p_source_id: body.source_id,
      p_idempotency_key: idempotency
    });

    if (error) throw error;
    const result = data[0] || data;
    
    return {
      success: true,
      message: 'Quote created',
      data: {
        id: result.id,
        quote_code: result.quote_code,
        quote_type: result.quote_type || body.quote_type || 'general',
        status: result.status,
        customer_name: result.customer_name,
        notes: result.notes,
        estimated_total_tzs: result.estimated_total_tzs,
        whatsapp_message: result.whatsapp_message || `Quote ${result.quote_code}`,
        whatsapp_clicked_at: result.whatsapp_clicked_at || null,
        whatsapp_url: result.whatsapp_url || buildWhatsappUrl(result.quote_code),
        idempotency_key: result.idempotency_key,
        created_at: result.created_at,
        updated_at: result.updated_at || result.created_at,
        source_cart_id: result.source_cart_id || (body.source_type === 'cart' ? body.source_id : null),
        source_build_id: result.source_build_id || (body.source_type === 'build' ? body.source_id : null),
        replacement_summary: result.replacement_summary || null,
        closed_reason: result.closed_reason || null
      }
    };
  } catch (error) {
    if (!env.enableDevFixtures) {
      console.error('[QUOTE ERROR] Failed to create quote:', error);
      throw error;
    }

    logError(error, 'quotes.createQuote.fallback');

    const cart = await getCart();
    const quoteId = randomId();
    const quoteCode = buildFixtureQuoteCode();
    const whatsappUrl = buildWhatsappUrl(quoteCode);
    const record: QuoteDetail = {
      id: quoteId,
      quote_code: quoteCode,
      quote_type: body.quote_type || 'general',
      status: 'new',
      customer_name: body.customer_name,
      notes: body.notes || null,
      estimated_total_tzs: cart.data.estimated_total_tzs,
      source_cart_id: body.source_type === 'cart' ? body.source_id : null,
      source_build_id: body.source_type === 'build' ? body.source_id : null,
      idempotency_key: body.idempotency_key || idempotencyKey || randomId(),
      replacement_summary: null,
      whatsapp_message: `Quote ${quoteCode}`,
      whatsapp_clicked_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
      closed_reason: null,
      whatsapp_url: whatsappUrl,
      items: cart.data.items.map((item) => ({
        id: randomId(),
        quote_id: quoteId,
        item_type: item.item_type,
        ref_product_id: item.product_id,
        ref_custom_build_id: item.custom_build_id,
        title_snapshot: item.title_snapshot,
        specs_snapshot: item.specs_snapshot,
        quantity: item.quantity,
        unit_estimated_price_tzs: item.unit_estimated_price_tzs,
        line_total_tzs: Number(item.quantity) * Number(item.unit_estimated_price_tzs),
        created_at: nowIso()
      }))
    };

    const quotes = loadFixtureQuotes();
    quotes.unshift(record);
    saveFixtureQuotes(quotes);

    return {
      success: true,
      message: 'Created (dev fixture fallback)',
      data: record
    };
  }
}

export async function getQuoteByCode(quoteCode: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_quote_with_items', {
      p_quote_code: quoteCode
    });

    if (error) throw error;
    const result = data[0] || data;
    
    return {
      success: true,
      message: 'Quote retrieved',
      data: {
        ...result,
        items: Array.isArray(result.items) ? result.items : JSON.parse(result.items || '[]')
      }
    };
  } catch (error) {
    if (!env.enableDevFixtures) {
      console.error('[QUOTE ERROR] Failed to get quote:', error);
      throw error;
    }

    logError(error, 'quotes.getQuoteByCode.fallback');
    const quote = loadFixtureQuotes().find((entry) => entry.quote_code === quoteCode);
    if (!quote) throw error;

    return {
      success: true,
      message: 'OK (dev fixture fallback)',
      data: quote
    };
  }
}

export async function trackQuoteWhatsappClick(quoteCode: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('track_quote_whatsapp_click', {
      p_quote_code: quoteCode
    });

    if (error) throw error;
    const result = data[0] || data;
    
    return {
      success: true,
      message: 'Click tracked',
      data: {
        id: result.id,
        quote_code: result.quote_code,
        whatsapp_clicked_at: result.whatsapp_clicked_at
      }
    };
  } catch (error) {
    if (!env.enableDevFixtures) {
      console.error('[QUOTE ERROR] Failed to track WhatsApp click:', error);
      throw error;
    }

    logError(error, 'quotes.trackQuoteWhatsappClick.fallback');
    const quotes = loadFixtureQuotes();
    const index = quotes.findIndex((entry) => entry.quote_code === quoteCode);
    if (index < 0) throw error;

    quotes[index] = {
      ...quotes[index],
      whatsapp_clicked_at: nowIso(),
      updated_at: nowIso()
    };
    saveFixtureQuotes(quotes);

    return {
      success: true,
      message: 'Tracked (dev fixture fallback)',
      data: quotes[index]
    };
  }
}

export async function getQuoteWhatsappUrl(quoteCode: string): Promise<any> {
  try {
    const { data, error } = await supabase.rpc('get_quote_with_items', {
      p_quote_code: quoteCode
    });

    if (error) throw error;
    const result = data[0] || data;
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_E164}?text=${encodeURIComponent(`Hello, I am following up on quote ${result.quote_code}.`)}`;
    
    return {
      success: true,
      message: 'URL retrieved',
      data: {
        quote_code: result.quote_code,
        whatsapp_url: whatsappUrl
      }
    };
  } catch (error) {
    if (!env.enableDevFixtures) {
      console.error('[QUOTE ERROR] Failed to get WhatsApp URL:', error);
      throw error;
    }

    logError(error, 'quotes.getQuoteWhatsappUrl.fallback');
    const quote = loadFixtureQuotes().find((entry) => entry.quote_code === quoteCode);
    if (!quote) throw error;

    return {
      success: true,
      message: 'OK (dev fixture fallback)',
      data: {
        quote_code: quote.quote_code,
        whatsapp_url: quote.whatsapp_url || buildWhatsappUrl(quote.quote_code)
      }
    };
  }
}
