import { z } from 'zod';

export const createQuoteSchema = z.object({
  customer_name: z.string().min(1).max(120),
  notes: z.string().max(1000).optional(),
  source_type: z.enum(['cart', 'build']),
  source_id: z.string().uuid(),
  quote_type: z.enum(['laptop', 'desktop', 'build', 'upgrade', 'warranty', 'general']).optional(),
  idempotency_key: z.string().min(12)
});

export const quoteCodeParamsSchema = z.object({
  quoteCode: z.string().min(3)
});
