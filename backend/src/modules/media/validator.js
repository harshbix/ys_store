import { z } from 'zod';

export const uploadMediaSchema = z.object({
  owner_type: z.enum(['product', 'shop']),
  owner_id: z.string().uuid().optional(),
  original_url: z.string().url(),
  thumb_url: z.string().url(),
  full_url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  size_bytes: z.number().int().positive().optional(),
  alt_text: z.string().optional(),
  caption: z.string().optional(),
  is_primary: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  sort_order: z.number().int().default(0)
});

export const mediaIdParamsSchema = z.object({ id: z.string().uuid() });
