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

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const adminActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(120).default(40)
});

export const adminProductsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(80).default(20)
});

export const adminBuildsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(80).default(20)
});

export const adminBuildComponentsQuerySchema = z.object({
  type: z.string().trim().min(1).max(64).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(160).default(40)
});

export const adminUserIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const adminChangePasswordSchema = z.object({
  current_password: z.string().min(8).max(128),
  new_password: z.string().min(8).max(128)
}).refine((value) => value.current_password !== value.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password']
});

export const buildPresetIdParamsSchema = z.object({
  id: z.string().min(2).max(120)
});

export const adminBuildItemSchema = z.object({
  slot_order: z.coerce.number().int().nonnegative(),
  component_type: z.string().min(1).max(64),
  component_id: z.string().min(1).max(128),
  quantity: z.coerce.number().int().positive().default(1)
});

export const adminBuildSchema = z.object({
  id: z.string().min(2).max(120).optional(),
  name: z.string().min(2).max(140),
  cpu_family: z.string().min(2).max(120),
  build_number: z.coerce.number().int().nonnegative().optional().nullable(),
  discount_percent: z.coerce.number().min(0).max(99.99).default(0),
  status: z.string().min(1).max(50).default('draft'),
  estimated_system_wattage: z.coerce.number().nonnegative().optional().nullable(),
  required_psu_wattage: z.coerce.number().nonnegative().optional().nullable(),
  compatibility_status: z.string().min(1).max(50).default('unknown'),
  is_visible: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  items: z.array(adminBuildItemSchema).min(1)
});
