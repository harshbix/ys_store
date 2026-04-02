import { z } from 'zod';

export const analyticsEventSchema = z.object({
  event_name: z.enum([
    'product_view',
    'add_to_cart',
    'build_created',
    'quote_created',
    'whatsapp_click',
    'whatsapp_click_initiated'
  ]),
  product_id: z.string().uuid().optional(),
  custom_build_id: z.string().uuid().optional(),
  quote_id: z.string().uuid().optional(),
  page_path: z.string().optional(),
  metadata: z.record(z.any()).default({})
});
