import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestOtp, syncPersistentCustomerCart, verifyOtp } from '../api/auth';
import { getCart } from '../api/cart';
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
  const challengeId = useAuthStore((state) => state.challengeId);
  const setOtpRequest = useAuthStore((state) => state.setOtpRequest);
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const logoutStore = useAuthStore((state) => state.logout);

  const requestOtpMutation = useMutation({
    mutationFn: (inputEmail: string) => requestOtp(inputEmail),
    onSuccess: (response, inputEmail) => {
      setOtpRequest(inputEmail, response.data.challenge_id);
      showToast({ title: 'Verification code sent', description: 'Check your email inbox for the OTP code.', variant: 'success' });
    },
    onError: (error) => {
      showToast({ title: 'Could not send code', description: toUserMessage(error, 'Please verify your email and try again.'), variant: 'error' });
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ inputEmail, code }: { inputEmail: string; code: string }) => {
      const currentChallengeId = useAuthStore.getState().challengeId;
      if (!currentChallengeId) {
        throw new Error('Verification session expired. Request a new code.');
      }

      return verifyOtp(inputEmail, currentChallengeId, code);
    },
    onSuccess: async (response, variables) => {
      const { access_token, customer_id, challenge_id } = response.data;
      completeLogin(access_token, customer_id);
      setOtpRequest(variables.inputEmail, challenge_id);
      showToast({ title: 'Welcome back', description: 'Your saved cart and wishlist are now linked.', variant: 'success' });

      try {
        const guestCart = await getCart();
        const sourceCartId = guestCart.data.cart.id;

        if (sourceCartId) {
          await syncPersistentCustomerCart(access_token, { source_cart_id: sourceCartId });
        }
      } catch (error) {
        logError(error, 'auth.syncPersistentCart');
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.wishlist });
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
    },
    onError: (error) => {
      showToast({ title: 'Code verification failed', description: toUserMessage(error, 'Please check the code and try again.'), variant: 'error' });
    }
  });

  const logout = () => {
    logoutStore();
    void queryClient.invalidateQueries({ queryKey: queryKeys.auth.wishlist });
    void queryClient.invalidateQueries({ queryKey: queryKeys.cart.current });
    showToast({ title: 'Signed out', variant: 'info' });
  };

  return {
    accessToken,
    customerId,
    email,
    challengeId,
    isAuthenticated: Boolean(accessToken && customerId),
    requestOtpMutation,
    verifyOtpMutation,
    logout
  };
}
