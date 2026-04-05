import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(128)
});

export const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128)
});

export const requestOtpSchema = z.object({
  email: z.string().email()
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
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
