import { apiFetch } from '../lib/apiClient';
import type { ApiEnvelope } from '../types/api';

export async function uploadAdminImage({ file, token, caption }: { file: File, token: string, caption?: string }) {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) formData.append('caption', caption);

  const response = await apiFetch<ApiEnvelope<any>>('/media/admin/upload/image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
      // Do NOT set Content-Type; browser will set multipart boundary
    },
    body: formData,
  });
  return response.data;
}
