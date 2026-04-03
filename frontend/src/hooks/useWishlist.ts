import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getProductBySlug } from '../api/products';
import { queryKeys } from '../lib/queryKeys';
import { useSessionStore } from '../store/session';
import type { WishlistRef } from '../types/ui';

export function useWishlist() {
  const wishlist = useSessionStore((state) => state.wishlist);
  const toggleWishlist = useSessionStore((state) => state.toggleWishlist);
  const removeFromWishlist = useSessionStore((state) => state.removeFromWishlist);

  const productQueries = useQueries({
    queries: wishlist.map((item) => ({
      queryKey: queryKeys.products.detail(item.slug),
      queryFn: () => getProductBySlug(item.slug),
      staleTime: 1000 * 60
    }))
  });

  const products = useMemo(() => {
    return productQueries
      .map((query) => query.data?.data)
      .filter((value): value is NonNullable<typeof value> => Boolean(value));
  }, [productQueries]);

  const isInWishlist = (productId: string) => wishlist.some((item) => item.id === productId);

  const toggle = (item: WishlistRef) => toggleWishlist(item);

  return {
    wishlist,
    products,
    isInWishlist,
    toggle,
    removeFromWishlist,
    isLoading: productQueries.some((query) => query.isLoading)
  };
}
