import { z } from 'zod';

export const seoEntityParamsSchema = z.object({
  id: z.string().trim().min(1).max(200)
});
