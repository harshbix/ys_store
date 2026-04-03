import { apiClient } from './client';
import type { ApiEnvelope, OtpRequestPayload, OtpVerifyPayload, WishlistPayload } from '../types/api';

interface PersistentCartPayload {
  customer_auth_id: string;
  cart: {
    id: string;
    status: string;
  };
  items: Array<{
    id: string;
    item_type: 'product' | 'custom_build';
    product_id: string | null;
    custom_build_id: string | null;
    quantity: number;
    unit_estimated_price_tzs: number;
  }>;
  estimated_total_tzs: number;
}

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

export async function addRemoteWishlistItem(product_id: string, token: string): Promise<ApiEnvelope<WishlistPayload>> {
  const { data } = await apiClient.post<ApiEnvelope<WishlistPayload>>('/auth/wishlist/items', { product_id }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
}

export async function removeRemoteWishlistItem(productId: string, token: string): Promise<ApiEnvelope<WishlistPayload>> {
  const { data } = await apiClient.delete<ApiEnvelope<WishlistPayload>>(`/auth/wishlist/items/${productId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
}

export async function getPersistentCustomerCart(token: string): Promise<ApiEnvelope<PersistentCartPayload>> {
  const { data } = await apiClient.get<ApiEnvelope<PersistentCartPayload>>('/auth/customer/persistent-cart', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
}

export async function syncPersistentCustomerCart(
  token: string,
  payload: {
    source_cart_id?: string;
    items?: Array<{
      item_type: 'product' | 'custom_build';
      product_id?: string;
      custom_build_id?: string;
      quantity: number;
    }>;
  }
): Promise<ApiEnvelope<PersistentCartPayload>> {
  const { data } = await apiClient.put<ApiEnvelope<PersistentCartPayload>>('/auth/customer/persistent-cart/sync', payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
}
