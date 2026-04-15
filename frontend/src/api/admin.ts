import { apiFetch } from '../lib/apiClient';
import type { ApiEnvelope } from '../types/api';
import type {
  AdminActivityItem,
  AdminBuild,
  AdminBuildComponent,
  AdminBuildPayload,
  AdminChangePasswordPayload,
  AdminChangePasswordResult,
  AdminDashboardSummaryPayload,
  AdminDeleteUserResult,
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
import type { ProductMedia } from '../types/api';

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
  params: { q?: string; limit?: number; page?: number } = {}
): Promise<AdminUsersSummaryPayload> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.limit) search.set('limit', String(params.limit));
  if (params.page) search.set('page', String(params.page));
  const endpoint = search.size ? `/admin/users?${search.toString()}` : '/admin/users';

  const response = await apiFetch<ApiEnvelope<AdminUsersSummaryPayload>>(endpoint, {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function getAdminActivity(token: string, limit = 40): Promise<AdminActivityItem[]> {
  return getAdminActivityPaged(token, { limit, page: 1 });
}

export async function getAdminActivityPaged(
  token: string,
  params: { limit?: number; page?: number } = {}
): Promise<AdminActivityItem[]> {
  const search = new URLSearchParams();
  if (params.limit) search.set('limit', String(params.limit));
  if (params.page) search.set('page', String(params.page));
  const endpoint = search.size ? `/admin/activity?${search.toString()}` : '/admin/activity';

  const response = await apiFetch<ApiEnvelope<AdminActivityItem[]>>(endpoint, {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function getAdminBuilds(
  token: string,
  params: { page?: number; limit?: number } = {}
): Promise<AdminBuild[]> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const endpoint = search.size ? `/admin/builds?${search.toString()}` : '/admin/builds';

  const response = await apiFetch<ApiEnvelope<AdminBuild[]>>(endpoint, {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function getAdminBuildComponents(
  token: string,
  params: { page?: number; limit?: number; type?: string } = {}
): Promise<AdminBuildComponent[]> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.type) search.set('type', params.type);
  const endpoint = search.size ? `/admin/build-components?${search.toString()}` : '/admin/build-components';

  const response = await apiFetch<ApiEnvelope<AdminBuildComponent[]>>(endpoint, {
    method: 'GET',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function deleteAdminUser(userId: string, token: string): Promise<AdminDeleteUserResult> {
  const response = await apiFetch<ApiEnvelope<AdminDeleteUserResult>>(`/admin/users/${userId}`, {
    method: 'DELETE',
    headers: withAdminToken(token)
  });
  return response.data;
}

export async function changeAdminPassword(
  payload: AdminChangePasswordPayload,
  token: string
): Promise<AdminChangePasswordResult> {
  const response = await apiFetch<ApiEnvelope<AdminChangePasswordResult>>('/admin/password', {
    method: 'PATCH',
    headers: withAdminToken(token),
    body: JSON.stringify(payload)
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

export async function getAdminProducts(
  token: string,
  params: { q?: string; page?: number; limit?: number } = {}
): Promise<AdminProduct[]> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const endpoint = search.size ? `/admin/products?${search.toString()}` : '/admin/products';

  const response = await apiFetch<ApiEnvelope<AdminProduct[]>>(endpoint, {
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

export async function updateAdminProductMedia(
  mediaId: string,
  payload: { is_primary?: boolean; sort_order?: number; alt_text?: string | null },
  token: string
): Promise<ProductMedia> {
  const response = await apiFetch<ApiEnvelope<ProductMedia>>(`/media/admin/product-media/${mediaId}`, {
    method: 'PATCH',
    headers: withAdminToken(token),
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function deleteAdminProductMedia(
  mediaId: string,
  token: string
): Promise<{ deleted: boolean; id: string }> {
  const response = await apiFetch<ApiEnvelope<{ deleted: boolean; id: string }>>(`/media/admin/product-media/${mediaId}`, {
    method: 'DELETE',
    headers: withAdminToken(token)
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
