import { useMemo } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { addRemoteWishlistItem, getRemoteWishlist, removeRemoteWishlistItem } from '../api/auth';
import { getProductBySlug } from '../api/products';
import { queryKeys } from '../lib/queryKeys';
import { useAuthStore } from '../store/auth';
import { useSessionStore } from '../store/session';
import type { Product } from '../types/api';
import type { WishlistRef } from '../types/ui';
import { toUserMessage } from '../utils/errors';
import { useShowToast } from './useToast';

export function useWishlist() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();

  const accessToken = useAuthStore((state) => state.accessToken);
  const wishlist = useSessionStore((state) => state.wishlist);
  const toggleWishlist = useSessionStore((state) => state.toggleWishlist);
  const removeFromWishlist = useSessionStore((state) => state.removeFromWishlist);

  const remoteWishlistQuery = useQuery({
    queryKey: queryKeys.auth.wishlist,
    queryFn: () => getRemoteWishlist(accessToken || ''),
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60,
    retry: 1
  });

  const productQueries = useQueries({
    queries: (accessToken ? [] : wishlist).map((item) => ({
      queryKey: queryKeys.products.detail(item.slug),
      queryFn: () => getProductBySlug(item.slug),
      staleTime: 1000 * 60
    }))
  });

  const localProducts = useMemo(() => {
    return productQueries
      .map((query) => query.data?.data)
      .filter((value): value is NonNullable<typeof value> => Boolean(value));
  }, [productQueries]);

  const remoteItems = remoteWishlistQuery.data?.data.items || [];

  const remoteProducts = useMemo<Product[]>(() => {
    return remoteItems
      .map((item) => item.products)
      .filter((value): value is Product => Boolean(value));
  }, [remoteItems]);

  const products = accessToken ? remoteProducts : localProducts;

  const resolvedWishlist = accessToken
    ? remoteItems.map((item) => ({
        id: item.product_id,
        slug: item.products?.slug || item.product_id,
        title: item.products?.title || 'Saved product'
      }))
    : wishlist;

  const isInWishlist = (productId: string) => {
    if (accessToken) {
      return remoteItems.some((item) => item.product_id === productId);
    }
    return wishlist.some((item) => item.id === productId);
  };

  const refreshRemoteWishlist = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.wishlist });
  };

  const toggle = (item: WishlistRef) => {
    if (!accessToken) {
      toggleWishlist(item);
      return;
    }

    void (async () => {
      try {
        const exists = remoteItems.some((entry) => entry.product_id === item.id);
        if (exists) {
          await removeRemoteWishlistItem(item.id, accessToken);
          showToast({ title: 'Removed from wishlist', variant: 'info' });
        } else {
          await addRemoteWishlistItem(item.id, accessToken);
          showToast({ title: 'Added to wishlist', variant: 'success' });
        }
        await refreshRemoteWishlist();
      } catch (error) {
        showToast({ title: 'Wishlist update failed', description: toUserMessage(error, 'Please retry in a moment.'), variant: 'error' });
      }
    })();
  };

  const remove = (productId: string) => {
    if (!accessToken) {
      removeFromWishlist(productId);
      return;
    }

    void (async () => {
      try {
        await removeRemoteWishlistItem(productId, accessToken);
        await refreshRemoteWishlist();
      } catch (error) {
        showToast({ title: 'Wishlist update failed', description: toUserMessage(error, 'Please retry in a moment.'), variant: 'error' });
      }
    })();
  };

  return {
    wishlist: resolvedWishlist,
    products,
    isInWishlist,
    toggle,
    removeFromWishlist: remove,
    isLoading: accessToken ? remoteWishlistQuery.isLoading : productQueries.some((query) => query.isLoading),
    isError: accessToken ? remoteWishlistQuery.isError : false
  };
}
