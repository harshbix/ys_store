import { z } from 'zod';

const specValueSchema = z.object({
  spec_key: z.string().min(1),
  value_text: z.string().optional(),
  value_number: z.number().optional(),
  value_bool: z.boolean().optional(),
  value_json: z.record(z.any()).optional(),
  unit: z.string().optional(),
  sort_order: z.number().int().default(0)
}).superRefine((v, ctx) => {
  const count = [v.value_text, v.value_number, v.value_bool, v.value_json].filter((x) => x !== undefined).length;
  if (count !== 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Exactly one spec value type must be provided' });
  }
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const adminProductSchema = z.object({
  sku: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  product_type: z.enum(['desktop', 'laptop', 'accessory', 'component']),
  brand: z.string().min(1),
  model_name: z.string().min(1),
  condition: z.enum(['new', 'imported_used', 'refurbished', 'custom_build']),
  stock_status: z.enum(['in_stock', 'low_stock', 'build_on_request', 'incoming_stock', 'sold_out']),
  estimated_price_tzs: z.number().int().nonnegative(),
  short_description: z.string().optional(),
  long_description: z.string().optional(),
  warranty_text: z.string().optional().nullable(),
  is_visible: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  featured_tag: z.enum(['best_seller', 'hot_deal', 'recommended']).optional().nullable(),
  specs: z.array(specValueSchema).default([])
});

export const productIdParamsSchema = z.object({ id: z.string().uuid() });
export const quoteIdParamsSchema = z.object({ id: z.string().uuid() });

export const quickEditSchema = z.object({
  estimated_price_tzs: z.number().int().nonnegative().optional(),
  stock_status: z.enum(['in_stock', 'low_stock', 'build_on_request', 'incoming_stock', 'sold_out']).optional()
}).refine((v) => v.estimated_price_tzs !== undefined || v.stock_status !== undefined, {
  message: 'At least one field required for quick edit'
});

export const stockSchema = z.object({
  stock_status: z.enum(['in_stock', 'low_stock', 'build_on_request', 'incoming_stock', 'sold_out'])
});

export const visibilitySchema = z.object({
  is_visible: z.boolean()
});

export const quoteStatusSchema = z.object({
  status: z.enum(['new', 'whatsapp_sent', 'negotiating', 'confirmed', 'closed_won', 'closed_lost']),
  closed_reason: z.string().max(500).optional()
});
