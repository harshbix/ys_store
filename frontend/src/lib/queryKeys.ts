import type { ProductFilters } from '../types/ui';

export const queryKeys = {
  health: ['health'] as const,
  auth: {
    wishlist: ['auth', 'wishlist'] as const
  },
  products: {
    list: (filters: Partial<ProductFilters>) => ['products', 'list', filters] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const
  },
  cart: {
    current: ['cart', 'current'] as const
  },
  builds: {
    detail: (buildId: string) => ['builds', 'detail', buildId] as const
  },
  admin: {
    me: ['admin', 'me'] as const,
    products: ['admin', 'products'] as const,
    quotes: ['admin', 'quotes'] as const
  },
  quotes: {
    detail: (quoteCode: string) => ['quotes', 'detail', quoteCode] as const
  }
};
