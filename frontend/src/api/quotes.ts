import { buildWhatsAppUrl as generateWhatsAppUrl } from '../utils/whatsapp';

// Correct the import path for generateWhatsAppMessage
import { generateWhatsAppMessage } from '../utils/generateWhatsAppMessage';
import { getCart } from './cart';
import { supabase } from '../lib/supabase';

import type { QuoteDetail, QuoteType } from '../types/api';
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
const UUID_V4_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const idempotency = idempotencyKey || body.idempotency_key || crypto.randomUUID();
    const customerName = body.customer_name?.trim() || '';
    const sourceType = body.source_type;
    const sourceId = body.source_id?.trim() || '';
    const notes = body.notes?.trim() ? body.notes.trim() : null;

    if (!customerName) {
      throw new Error('customer_name is empty before create_quote_from_cart call');
    }

    if (sourceType !== 'cart') {
      throw new Error(`create_quote_from_cart supports only cart source_type; received: ${sourceType}`);
    }

    if (!UUID_V4_LIKE.test(sourceId)) {
      throw new Error(`source_id is not a valid uuid for create_quote_from_cart: ${sourceId || '<empty>'}`);
    }

    const rpcPayload = {
      p_customer_name: customerName,
      p_notes: notes,
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_idempotency_key: idempotency
    };

    console.info('[QUOTE RPC] create_quote_from_cart payload', rpcPayload);

    const { data, error } = await supabase.rpc('create_quote_from_cart', rpcPayload);

    if (error) {
      console.error('[QUOTE RPC ERROR] create_quote_from_cart failed', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload: rpcPayload
      });
      throw error;
    }

    const result = data?.[0] || data;
    const cart = await getCart();
    // Ensure generatedMessage is defined before use
    const generatedMessage = generateWhatsAppMessage(cart, customerName);
    const customUrl = generateWhatsAppUrl(generatedMessage);

    return {
      success: true,
      message: 'Quote created',
      data: {
        ...result,
        whatsapp_url: customUrl
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
    const whatsappUrl = generateWhatsAppUrl(generatedMessage);
    const record: QuoteDetail = {
      id: quoteId,
      quote_code: quoteCode,
      quote_type: body.quote_type || 'general',
      status: 'new',
      customer_name: body.customer_name,
      notes: body.notes || null,
      estimated_total_tzs: cart.estimated_total_tzs,
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
      items: cart.items.map((item) => ({
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

    const result = data?.[0] || data;
    return {
      success: true,
      message: 'Quote retrieved',
      data: {
        ...result,
        items: Array.isArray(result?.items) ? result.items : JSON.parse(result?.items || '[]')
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

    const result = data?.[0] || data;
    return {
      success: true,
      message: 'Click tracked',
      data: result
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

    const result = data?.[0] || data;
    const whatsappUrl = result?.whatsapp_url || generateWhatsAppUrl(result?.quote_code || quoteCode);

    return {
      success: true,
      message: 'URL retrieved',
      data: {
        quote_code: result?.quote_code || quoteCode,
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
        whatsapp_url: quote.whatsapp_url || generateWhatsAppUrl(quote.quote_code)
      }
    };
  }
}







