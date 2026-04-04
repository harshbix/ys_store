import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCartItem, getCart, removeCartItem, updateCartItem, type AddCartItemBody } from '../api/cart';
import { queryKeys } from '../lib/queryKeys';
import type { ApiEnvelope, CartPayload } from '../types/api';
import { useShowToast } from './useToast';

export function useCart() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();

  const cartQuery = useQuery({
    queryKey: queryKeys.cart.current,
    queryFn: getCart,
    staleTime: 1000 * 10,
    retry: 1
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
  };

  const addItem = useMutation({
    mutationFn: (body: AddCartItemBody) => addCartItem(body),
    onSuccess: () => {
      showToast({ title: 'Added to cart', variant: 'success' });
      void invalidate();
    },
    onError: () => {
      showToast({ title: 'Could not add item', description: 'Please try again.', variant: 'error' });
    }
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateCartItem(itemId, { quantity }),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current });
      const previousCart = queryClient.getQueryData<ApiEnvelope<CartPayload>>(queryKeys.cart.current);

      if (previousCart?.data) {
        const nextItems = previousCart.data.items.map((item) => (
          item.id === itemId
            ? { ...item, quantity }
            : item
        ));

        const estimatedTotal = nextItems.reduce((sum, item) => sum + (item.unit_estimated_price_tzs * item.quantity), 0);

        queryClient.setQueryData<ApiEnvelope<CartPayload>>(queryKeys.cart.current, {
          ...previousCart,
          data: {
            ...previousCart.data,
            items: nextItems,
            estimated_total_tzs: estimatedTotal
          }
        });
      }

      return { previousCart };
    },
    onSuccess: () => {
      void invalidate();
    },
    onError: (_, __, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.current, context.previousCart);
      }
      showToast({ title: 'Cart update failed', variant: 'error' });
    }
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.current });
      const previousCart = queryClient.getQueryData<ApiEnvelope<CartPayload>>(queryKeys.cart.current);

      if (previousCart?.data) {
        const nextItems = previousCart.data.items.filter((item) => item.id !== itemId);
        const estimatedTotal = nextItems.reduce((sum, item) => sum + (item.unit_estimated_price_tzs * item.quantity), 0);

        queryClient.setQueryData<ApiEnvelope<CartPayload>>(queryKeys.cart.current, {
          ...previousCart,
          data: {
            ...previousCart.data,
            items: nextItems,
            estimated_total_tzs: estimatedTotal
          }
        });
      }

      return { previousCart };
    },
    onSuccess: () => {
      showToast({ title: 'Item removed', variant: 'info' });
      void invalidate();
    },
    onError: (_, __, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(queryKeys.cart.current, context.previousCart);
      }
      showToast({ title: 'Could not remove item', variant: 'error' });
    }
  });

  return {
    cartQuery,
    addItem,
    updateItem,
    removeItem,
    refreshCart: invalidate
  };
}
