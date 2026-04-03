import { apiClient } from './client';
import type { ApiEnvelope } from '../types/api';
import type {
  AdminFinalizeUploadPayload,
  AdminLoginPayload,
  AdminProduct,
  AdminProductDetail,
  AdminProductPayload,
  AdminQuote,
  AdminSignedUploadPayload,
  AdminSignedUploadResponse,
  AdminUser
} from '../types/admin';

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

export async function getAdminProductById(productId: string, token?: string): Promise<ApiEnvelope<AdminProductDetail>> {
  const { data } = await apiClient.get<ApiEnvelope<AdminProductDetail>>(`/admin/products/${productId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function createAdminProduct(payload: AdminProductPayload, token?: string): Promise<ApiEnvelope<AdminProduct>> {
  const { data } = await apiClient.post<ApiEnvelope<AdminProduct>>('/admin/products', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function updateAdminProduct(productId: string, payload: AdminProductPayload, token?: string): Promise<ApiEnvelope<AdminProduct>> {
  const { data } = await apiClient.patch<ApiEnvelope<AdminProduct>>(`/admin/products/${productId}`, payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function duplicateAdminProduct(productId: string, token?: string): Promise<ApiEnvelope<AdminProduct>> {
  const { data } = await apiClient.post<ApiEnvelope<AdminProduct>>(`/admin/products/${productId}/duplicate`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function archiveAdminProduct(productId: string, token?: string): Promise<ApiEnvelope<AdminProduct>> {
  const { data } = await apiClient.patch<ApiEnvelope<AdminProduct>>(`/admin/products/${productId}/visibility`, {
    is_visible: false
  }, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function publishAdminProduct(productId: string, token?: string): Promise<ApiEnvelope<AdminProduct>> {
  const { data } = await apiClient.patch<ApiEnvelope<AdminProduct>>(`/admin/products/${productId}/visibility`, {
    is_visible: true
  }, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function createAdminUploadUrl(payload: AdminSignedUploadPayload, token?: string): Promise<ApiEnvelope<AdminSignedUploadResponse>> {
  const { data } = await apiClient.post<ApiEnvelope<AdminSignedUploadResponse>>('/media/admin/upload-url', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  return data;
}

export async function finalizeAdminUpload(payload: AdminFinalizeUploadPayload, token?: string): Promise<ApiEnvelope<unknown>> {
  const { data } = await apiClient.post<ApiEnvelope<unknown>>('/media/admin/upload/finalize', payload, {
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
