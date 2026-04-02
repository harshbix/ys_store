import { z } from 'zod';

export const listProductsQuerySchema = z.object({
  type: z.enum(['desktop', 'laptop', 'accessory', 'component']).optional(),
  brand: z.string().min(1).optional(),
  condition: z.enum(['new', 'imported_used', 'refurbished', 'custom_build']).optional(),
  min_price: z.coerce.number().int().nonnegative().optional(),
  max_price: z.coerce.number().int().nonnegative().optional(),
  cpu: z.string().optional(),
  gpu: z.string().optional(),
  ram_gb: z.coerce.number().int().positive().optional(),
  storage_gb: z.coerce.number().int().positive().optional(),
  screen_size: z.coerce.number().positive().optional(),
  refresh_rate: z.coerce.number().positive().optional(),
  stock_status: z.enum(['in_stock', 'low_stock', 'build_on_request', 'incoming_stock', 'sold_out']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(60).default(20),
  sort: z.enum(['price_asc', 'price_desc', 'newest']).default('newest')
});

export const productSlugParamsSchema = z.object({
  slug: z.string().min(1)
});

export const filterOptionsQuerySchema = z.object({
  type: z.enum(['desktop', 'laptop', 'accessory', 'component']).optional()
});

export const compareBodySchema = z.object({
  product_ids: z.array(z.string().uuid()).min(2).max(3)
});
