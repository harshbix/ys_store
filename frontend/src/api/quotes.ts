import { apiClient } from './client';
import type { ApiEnvelope, QuoteDetail, QuoteRecord, QuoteType } from '../types/api';

export interface CreateQuoteBody {
  customer_name: string;
  notes?: string;
  source_type: 'cart' | 'build';
  source_id: string;
  quote_type?: QuoteType;
  idempotency_key?: string;
}

export async function createQuote(body: CreateQuoteBody, idempotencyKey?: string): Promise<ApiEnvelope<QuoteRecord>> {
  const { data } = await apiClient.post<ApiEnvelope<QuoteRecord>>('/quotes', body, {
    headers: idempotencyKey
      ? {
          'Idempotency-Key': idempotencyKey,
          'x-idempotency-key': idempotencyKey
        }
      : undefined
  });

  return data;
}

export async function getQuoteByCode(quoteCode: string): Promise<ApiEnvelope<QuoteDetail>> {
  const { data } = await apiClient.get<ApiEnvelope<QuoteDetail>>(`/quotes/${quoteCode}`);
  return data;
}

export async function trackQuoteWhatsappClick(quoteCode: string): Promise<ApiEnvelope<QuoteRecord>> {
  const { data } = await apiClient.post<ApiEnvelope<QuoteRecord>>(`/quotes/${quoteCode}/whatsapp-click`, {});
  return data;
}

export async function getQuoteWhatsappUrl(quoteCode: string): Promise<ApiEnvelope<{ quote_code: string; whatsapp_url: string }>> {
  const { data } = await apiClient.get<ApiEnvelope<{ quote_code: string; whatsapp_url: string }>>(`/quotes/${quoteCode}/whatsapp-url`);
  return data;
}
