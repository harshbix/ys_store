import { z } from 'zod';

export const addCartItemSchema = z.object({
  item_type: z.enum(['product', 'custom_build']),
  product_id: z.string().uuid().optional(),
  custom_build_id: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive().default(1)
}).superRefine((v, ctx) => {
  const hasProduct = !!v.product_id;
  const hasBuild = !!v.custom_build_id;
  if (hasProduct === hasBuild) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Exactly one item reference is required' });
  }
});

export const updateCartItemParamsSchema = z.object({
  itemId: z.string().uuid()
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive()
});
