import { apiClient } from './client';
import type { ApiEnvelope, CartItemType, CartPayload } from '../types/api';

export interface AddCartItemBody {
  item_type: CartItemType;
  product_id?: string;
  custom_build_id?: string;
  quantity?: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

export async function getCart(): Promise<ApiEnvelope<CartPayload>> {
  const { data } = await apiClient.get<ApiEnvelope<CartPayload>>('/cart');
  return data;
}

export async function addCartItem(body: AddCartItemBody): Promise<ApiEnvelope<CartPayload>> {
  const { data } = await apiClient.post<ApiEnvelope<CartPayload>>('/cart/items', body);
  return data;
}

export async function updateCartItem(itemId: string, body: UpdateCartItemBody): Promise<ApiEnvelope<CartPayload>> {
  const { data } = await apiClient.patch<ApiEnvelope<CartPayload>>(`/cart/items/${itemId}`, body);
  return data;
}

export async function removeCartItem(itemId: string): Promise<ApiEnvelope<CartPayload>> {
  const { data } = await apiClient.delete<ApiEnvelope<CartPayload>>(`/cart/items/${itemId}`);
  return data;
}
