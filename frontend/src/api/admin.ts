import { apiClient } from './client';
import type { ApiEnvelope } from '../types/api';
import type { AdminLoginPayload, AdminProduct, AdminQuote, AdminUser } from '../types/admin';

export async function adminLogin(email: string, password: string): Promise<ApiEnvelope<AdminLoginPayload>> {
  const { data } = await apiClient.post<ApiEnvelope<AdminLoginPayload>>('/admin/login', {
    email,
    password
  });

  return data;
}

export async function adminLogout(token?: string): Promise<ApiEnvelope<{ logged_out: boolean }>> {
  const { data } = await apiClient.post<ApiEnvelope<{ logged_out: boolean }>>('/admin/logout', {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function getAdminMe(token?: string): Promise<ApiEnvelope<{ admin: AdminUser }>> {
  const { data } = await apiClient.get<ApiEnvelope<{ admin: AdminUser }>>('/admin/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function getAdminProducts(token?: string): Promise<ApiEnvelope<AdminProduct[]>> {
  const { data } = await apiClient.get<ApiEnvelope<AdminProduct[]>>('/admin/products', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function getAdminQuotes(token?: string): Promise<ApiEnvelope<AdminQuote[]>> {
  const { data } = await apiClient.get<ApiEnvelope<AdminQuote[]>>('/admin/quotes', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}
