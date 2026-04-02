import { z } from 'zod';

export const requestOtpSchema = z.object({
  phone: z.string().min(10).max(20)
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(20),
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
