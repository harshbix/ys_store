import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCartItem, getCart, removeCartItem, updateCartItem, type AddCartItemBody } from '../api/cart';
import { queryKeys } from '../lib/queryKeys';
import { useToast } from './useToast';

export function useCart() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
    onSuccess: () => {
      void invalidate();
    },
    onError: () => {
      showToast({ title: 'Cart update failed', variant: 'error' });
    }
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => {
      showToast({ title: 'Item removed', variant: 'info' });
      void invalidate();
    },
    onError: () => {
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
