import { useQuery } from '@tanstack/react-query';
import type { GetProductsParams } from '../api/products';
import { queryKeys } from '../lib/queryKeys';

export function useProducts(params: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      const { getProducts } = await import('../api/products');
      return getProducts(params);
    },
    staleTime: 1000 * 30,
    retry: 1
  });
}

export function useProductDetail(slug?: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug || ''),
    queryFn: async () => {
      const { getProductBySlug } = await import('../api/products');
      return getProductBySlug(slug || '');
    },
    enabled: Boolean(slug),
    staleTime: 1000 * 30,
    retry: 1
  });
}
