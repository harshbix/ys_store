import { apiFetch } from '../lib/apiClient';
import { supabase } from '../lib/supabase';
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

export async function adminLogin(email: string, password: string): Promise<AdminLoginPayload> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user || !data.session) {
    throw new Error(error?.message || 'Login failed');
  }

  const { data: adminUser, error: roleError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (roleError || !adminUser || adminUser.role !== 'owner') {
    await supabase.auth.signOut();
    throw new Error('Unauthorized access');
  }

  return {
    token: data.session.access_token,
    admin: {
      id: data.user.id,
      email: data.user.email!,
      role: 'owner',
      created_at: data.user.created_at
    }
  };
}

export async function adminLogout(token: string): Promise<{ logged_out: boolean }> {
  await supabase.auth.signOut();
  return { logged_out: true };
}

export async function getAdminMe(token: string): Promise<{ admin: AdminUser }> {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Not authenticated');

  const { data: adminUser, error: roleError } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (roleError || !adminUser || (adminUser.role !== 'owner' && adminUser.role !== 'admin')) {
    throw new Error('Unauthorized access');
  }

  return {
    admin: {
      id: user.id,
      email: user.email!,
      role: 'owner',
      created_at: user.created_at
    }
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
