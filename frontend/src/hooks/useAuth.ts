import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  loginWithPassword,
  registerWithPassword,
  syncPersistentCustomerCart
} from '../api/auth';
import { getCart } from '../api/cart';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryKeys';
import { useAuthStore } from '../store/auth';
import { logError, toUserMessage } from '../utils/errors';
import { useShowToast } from './useToast';

export function useAuth() {
  const queryClient = useQueryClient();
  const showToast = useShowToast();

  const accessToken = useAuthStore((state) => state.accessToken);
  const customerId = useAuthStore((state) => state.customerId);
  const email = useAuthStore((state) => state.email);
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const logoutStore = useAuthStore((state) => state.logout);

  const syncGuestCartToCustomer = async (token: string) => {
    try {
      const guestCart = await getCart();
      const sourceCartId = guestCart.cart.id;

      if (sourceCartId) {
        await syncPersistentCustomerCart(token, { source_cart_id: sourceCartId });
      }
    } catch (error) {
      logError(error, 'auth.syncPersistentCart');
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.auth.wishlist });
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
  };

  const loginMutation = useMutation({
    mutationFn: ({ inputEmail, password }: { inputEmail: string; password: string }) => loginWithPassword(inputEmail, password),
    onSuccess: async (response, variables) => {
      const { access_token, customer_id } = response;
      completeLogin(access_token, customer_id, variables.inputEmail.trim());
      showToast({ title: 'Welcome back', description: 'You are signed in.', variant: 'success' });
      await syncGuestCartToCustomer(access_token);
    },
    onError: (error) => {
      showToast({ title: 'Login failed', description: toUserMessage(error, 'Check your email or password.'), variant: 'error' });
    }
  });

  const registerMutation = useMutation({
    mutationFn: ({ fullName, inputEmail, password }: { fullName: string; inputEmail: string; password: string }) =>
      registerWithPassword(fullName, inputEmail, password),
    onSuccess: async (response, variables) => {
      if (response.requires_email_verification || !response.access_token) {
        showToast({
          title: 'Account created',
          description: 'Check your email to verify your account, then sign in.',
          variant: 'info'
        });
        return;
      }

      const { access_token, customer_id } = response;
      completeLogin(access_token, customer_id, variables.inputEmail.trim());
      showToast({ title: 'Account created', description: 'Your account is ready.', variant: 'success' });
      await syncGuestCartToCustomer(access_token);
    },
    onError: (error) => {
      showToast({ title: 'Could not create account', description: toUserMessage(error, 'Try a different email.'), variant: 'error' });
    }
  });

  const logout = () => {
    void (async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        logError(error, 'auth.logout.signOut');
      }

      logoutStore();
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.wishlist });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
      showToast({ title: 'Signed out', variant: 'info' });
    })();
  };

  return {
    accessToken,
    customerId,
    email,
    isAuthenticated: Boolean(accessToken && customerId),
    loginMutation,
    registerMutation,
    logout
  };
}
