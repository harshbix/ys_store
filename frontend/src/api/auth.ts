import { apiClient } from './client';
import type { ApiEnvelope, OtpRequestPayload, OtpVerifyPayload, WishlistPayload } from '../types/api';

export async function requestOtp(phone: string): Promise<ApiEnvelope<OtpRequestPayload>> {
  const { data } = await apiClient.post<ApiEnvelope<OtpRequestPayload>>('/auth/request-otp', { phone });
  return data;
}

export async function verifyOtp(phone: string, challenge_id: string, code: string): Promise<ApiEnvelope<OtpVerifyPayload>> {
  const { data } = await apiClient.post<ApiEnvelope<OtpVerifyPayload>>('/auth/verify-otp', {
    phone,
    challenge_id,
    code
  });
  return data;
}

export async function getRemoteWishlist(token: string): Promise<ApiEnvelope<WishlistPayload>> {
  const { data } = await apiClient.get<ApiEnvelope<WishlistPayload>>('/auth/wishlist', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
}
