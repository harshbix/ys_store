import { z } from 'zod';

export const createUploadUrlSchema = z.object({
  owner_type: z.enum(['product', 'shop']),
  owner_id: z.string().uuid().optional(),
  file_name: z.string().min(3),
  content_type: z.string().min(3),
  variant: z.enum(['original', 'thumb', 'full'])
});

export const finalizeUploadSchema = z.object({
  owner_type: z.enum(['product', 'shop']),
  owner_id: z.string().uuid().optional(),
  original_path: z.string().min(3),
  thumb_path: z.string().min(3),
  full_path: z.string().min(3),
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
