import { z } from 'zod';

export const buildIdParamsSchema = z.object({
  buildId: z.string().uuid()
});

export const createBuildSchema = z.object({
  name: z.string().max(120).optional()
});

export const upsertBuildItemSchema = z.object({
  component_type: z.enum([
    'cpu',
    'motherboard',
    'gpu',
    'ram',
    'storage',
    'psu',
    'case',
    'cooler',
    'monitor',
    'keyboard_mouse',
    'windows_license'
  ]),
  product_id: z.string().uuid()
});

export const validateBuildSchema = z.object({
  auto_replace: z.boolean().default(true)
});

export const buildItemParamsSchema = z.object({
  buildId: z.string().uuid(),
  itemId: z.string().uuid()
});
