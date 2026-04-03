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
  const phone = useAuthStore((state) => state.phone);
  const challengeId = useAuthStore((state) => state.challengeId);
  const setOtpRequest = useAuthStore((state) => state.setOtpRequest);
  const completeLogin = useAuthStore((state) => state.completeLogin);
  const logoutStore = useAuthStore((state) => state.logout);

  const requestOtpMutation = useMutation({
    mutationFn: (inputPhone: string) => requestOtp(inputPhone),
    onSuccess: (response, inputPhone) => {
      setOtpRequest(inputPhone, response.data.challenge_id);
      showToast({ title: 'OTP sent', description: 'Check your phone for the verification code.', variant: 'success' });
    },
    onError: (error) => {
      showToast({ title: 'OTP request failed', description: toUserMessage(error, 'Please verify your phone and retry.'), variant: 'error' });
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: ({ inputPhone, code }: { inputPhone: string; code: string }) => {
      const currentChallengeId = useAuthStore.getState().challengeId;
      if (!currentChallengeId) {
        throw new Error('OTP challenge is missing. Request a new OTP first.');
      }

      return verifyOtp(inputPhone, currentChallengeId, code);
    },
    onSuccess: async (response, variables) => {
      const { access_token, customer_id, challenge_id } = response.data;
      completeLogin(access_token, customer_id);
      setOtpRequest(variables.inputPhone, challenge_id);
      showToast({ title: 'Signed in', description: 'Your account is now linked to this session.', variant: 'success' });

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
      showToast({ title: 'OTP verification failed', description: toUserMessage(error, 'Please confirm the code and try again.'), variant: 'error' });
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
    phone,
    challengeId,
    isAuthenticated: Boolean(accessToken && customerId),
    requestOtpMutation,
    verifyOtpMutation,
    logout
  };
}
