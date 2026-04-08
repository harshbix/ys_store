import { apiFetch } from '../lib/apiClient';
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

function withAdminToken(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`
  };
}

/**
 * Login to admin panel using email and password
 * Returns a backend JWT token (not Supabase token)
 */
export async function adminLogin(email: string, password: string): Promise<AdminLoginPayload> {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const response = await apiFetch<ApiEnvelope<AdminLoginPayload>>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  if (!response.data?.token || !response.data?.admin) {
    throw new Error('Admin login failed: invalid response from server');
  }

  return response.data;
}

export async function adminLogout(token: string): Promise<{ logged_out: boolean }> {
  // Just clear client-side since backend logout is stateless
  return { logged_out: true };
}

export async function getAdminMe(token: string): Promise<{ admin: AdminUser }> {
  const meResponse = await apiFetch<ApiEnvelope<{ admin: AdminUser }>>('/admin/me', {
    method: 'GET',
    headers: withAdminToken(token)
  });

  if (!meResponse.data?.admin) {
    throw new Error('Unauthorized access');
  }

  return {
    admin: meResponse.data.admin
  };
}

export async function getAdminProducts(token: string): Promise<AdminProduct[]> {
  const response = await apiFetch<ApiEnvelope<AdminProduct[]>>('/admin/products', {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function getAdminProductById(productId: string, token: string): Promise<AdminProductDetail> {
  const response = await apiFetch<ApiEnvelope<AdminProductDetail>>(`/admin/products/${productId}`, {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function createAdminProduct(
  payload: AdminProductPayload,
  token: string
): Promise<AdminProduct> {
  const response = await apiFetch<ApiEnvelope<AdminProduct>>('/admin/products', {
    method: 'POST',
    headers: withAdminToken(token),
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updateAdminProduct(
  productId: string,
  payload: AdminProductPayload,
  token: string
): Promise<AdminProduct> {
  const response = await apiFetch<ApiEnvelope<AdminProduct>>(`/admin/products/${productId}`, {
    method: 'PATCH',
    headers: withAdminToken(token),
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function duplicateAdminProduct(productId: string, token: string): Promise<AdminProduct> {
  const response = await apiFetch<ApiEnvelope<AdminProduct>>(`/admin/products/${productId}/duplicate`, {
    method: 'POST',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function updateProductVisibility(
  productId: string,
  isVisible: boolean,
  token: string
): Promise<AdminProduct> {
  const response = await apiFetch<ApiEnvelope<AdminProduct>>(`/admin/products/${productId}/visibility`, {
    method: 'PATCH',
    headers: withAdminToken(token),
    body: JSON.stringify({ is_visible: isVisible })
  });
  return response.data;
}

export async function archiveProduct(productId: string, token: string): Promise<AdminProduct> {
  return updateProductVisibility(productId, false, token);
}

export async function publishProduct(productId: string, token: string): Promise<AdminProduct> {
  return updateProductVisibility(productId, true, token);
}

export async function getAdminUploadUrl(
  payload: AdminSignedUploadPayload,
  token: string
): Promise<AdminSignedUploadResponse> {
  const response = await apiFetch<ApiEnvelope<AdminSignedUploadResponse>>('/media/admin/upload-url', {
    method: 'POST',
    headers: withAdminToken(token),
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function finalizeAdminUpload(
  payload: AdminFinalizeUploadPayload,
  token: string
): Promise<unknown> {
  const response = await apiFetch<ApiEnvelope<unknown>>('/media/admin/upload/finalize', {
    method: 'POST',
    headers: withAdminToken(token),
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function getAdminQuotes(token: string): Promise<AdminQuote[]> {
  const response = await apiFetch<ApiEnvelope<AdminQuote[]>>('/admin/quotes', {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}
