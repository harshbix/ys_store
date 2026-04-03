import { z } from 'zod';

const phoneSchema = z.string().regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in E.164 format (e.g. +255712345678)');

export const requestOtpSchema = z.object({
  phone: phoneSchema
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  challenge_id: z.string().min(6),
  code: z.string().min(4).max(8)
});

export const wishlistItemSchema = z.object({
  product_id: z.string().uuid()
});

export const wishlistItemParamsSchema = z.object({
  productId: z.string().uuid()
});

export const syncPersistentCartSchema = z.object({
  source_cart_id: z.string().uuid().optional(),
  items: z.array(z.object({
    item_type: z.enum(['product', 'custom_build']),
    product_id: z.string().uuid().optional(),
    custom_build_id: z.string().uuid().optional(),
    quantity: z.coerce.number().int().positive()
  })).optional()
});
