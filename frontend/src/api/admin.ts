import { apiFetch } from '../lib/apiClient';
import type { ApiEnvelope } from '../types/api';
import type {
  AdminActivityItem,
  AdminBuild,
  AdminBuildComponent,
  AdminBuildPayload,
  AdminDashboardSummaryPayload,
  AdminFinalizeUploadPayload,
  AdminLoginPayload,
  AdminProduct,
  AdminProductDetail,
  AdminProductPayload,
  AdminQuote,
  AdminSignedUploadPayload,
  AdminSignedUploadResponse,
  AdminUser,
  AdminUsersSummaryPayload
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

export async function getAdminDashboardSummary(token: string): Promise<AdminDashboardSummaryPayload> {
  const response = await apiFetch<ApiEnvelope<AdminDashboardSummaryPayload>>('/admin/dashboard/summary', {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function getAdminUsersSummary(
  token: string,
  params: { q?: string; limit?: number } = {}
): Promise<AdminUsersSummaryPayload> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.limit) search.set('limit', String(params.limit));
  const endpoint = search.size ? `/admin/users?${search.toString()}` : '/admin/users';

  const response = await apiFetch<ApiEnvelope<AdminUsersSummaryPayload>>(endpoint, {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function getAdminActivity(token: string, limit = 40): Promise<AdminActivityItem[]> {
  const response = await apiFetch<ApiEnvelope<AdminActivityItem[]>>(`/admin/activity?limit=${encodeURIComponent(String(limit))}`, {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function getAdminBuilds(token: string): Promise<AdminBuild[]> {
  const response = await apiFetch<ApiEnvelope<AdminBuild[]>>('/admin/builds', {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function getAdminBuildComponents(token: string): Promise<AdminBuildComponent[]> {
  const response = await apiFetch<ApiEnvelope<AdminBuildComponent[]>>('/admin/build-components', {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function createAdminBuild(payload: AdminBuildPayload, token: string): Promise<AdminBuild> {
  const response = await apiFetch<ApiEnvelope<AdminBuild>>('/admin/builds', {
    method: 'POST',
    headers: withAdminToken(token),
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updateAdminBuild(
  buildId: string,
  payload: AdminBuildPayload,
  token: string
): Promise<AdminBuild> {
  const response = await apiFetch<ApiEnvelope<AdminBuild>>(`/admin/builds/${buildId}`, {
    method: 'PATCH',
    headers: withAdminToken(token),
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function deleteAdminBuild(buildId: string, token: string): Promise<{ deleted: boolean; id: string }> {
  const response = await apiFetch<ApiEnvelope<{ deleted: boolean; id: string }>>(`/admin/builds/${buildId}`, {
    method: 'DELETE',
    headers: withAdminToken(token)
  });
  return response.data;
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
