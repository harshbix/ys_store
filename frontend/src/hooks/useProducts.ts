import { useQuery } from '@tanstack/react-query';
import { getProductBySlug, getProducts, type GetProductsParams } from '../api/products';
import { queryKeys } from '../lib/queryKeys';

export function useProducts(params: GetProductsParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => getProducts(params),
    staleTime: 1000 * 30,
    retry: 1
  });
}

export function useProductDetail(slug?: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug || ''),
    queryFn: () => getProductBySlug(slug || ''),
    enabled: Boolean(slug),
    staleTime: 1000 * 30,
    retry: 1
  });
}
