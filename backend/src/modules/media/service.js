import {
  createSignedUploadUrl,
  getPublicUrl,
  insertProductMedia,
  listShopMedia,
  insertShopMedia,
  updateShopMedia,
  deleteShopMedia
} from './repository.js';
import { env } from '../../config/env.js';

function sanitizeName(fileName) {
  return fileName.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
}

export async function createUploadUrl(payload) {
  const base = payload.owner_type === 'product'
    ? `products/${payload.owner_id || 'unassigned'}`
    : 'shop';
  const path = `${base}/${payload.variant}/${Date.now()}-${sanitizeName(payload.file_name)}`;

  const signed = await createSignedUploadUrl(env.supabaseStorageBucket, path);
  if (signed.error) throw { status: 500, code: 'media_signed_url_failed', message: signed.error.message };

  return {
    path,
    token: signed.data.token,
    signed_url: signed.data.signedUrl
  };
}

export async function finalizeUpload(payload) {
  const originalUrl = getPublicUrl(env.supabaseStorageBucket, payload.original_path).data.publicUrl;
  const thumbUrl = getPublicUrl(env.supabaseStorageBucket, payload.thumb_path).data.publicUrl;
  const fullUrl = getPublicUrl(env.supabaseStorageBucket, payload.full_path).data.publicUrl;

  if (payload.owner_type === 'product') {
    const res = await insertProductMedia({
      product_id: payload.owner_id,
      original_url: originalUrl,
      thumb_url: thumbUrl,
      full_url: fullUrl,
      width: payload.width,
      height: payload.height,
      size_bytes: payload.size_bytes,
      alt_text: payload.alt_text || null,
      is_primary: payload.is_primary || false,
      sort_order: payload.sort_order || 0
    });
    if (res.error) throw { status: 500, code: 'product_media_upload_failed', message: res.error.message };
    return res.data;
  }

  const res = await insertShopMedia({
    original_url: originalUrl,
    thumb_url: thumbUrl,
    full_url: fullUrl,
    width: payload.width,
    height: payload.height,
    size_bytes: payload.size_bytes,
    caption: payload.caption || null,
    is_visible: payload.is_visible ?? true,
    sort_order: payload.sort_order || 0
  });

  if (res.error) throw { status: 500, code: 'shop_media_upload_failed', message: res.error.message };
  return res.data;
}

export async function getShopMedia() {
  const res = await listShopMedia();
  if (res.error) throw { status: 500, code: 'shop_media_list_failed', message: res.error.message };
  return res.data || [];
}

export async function updateShopMediaItem(id, payload) {
  const res = await updateShopMedia(id, payload);
  if (res.error) throw { status: 500, code: 'shop_media_update_failed', message: res.error.message };
  return res.data;
}

export async function removeShopMediaItem(id) {
  const res = await deleteShopMedia(id);
  if (res.error) throw { status: 500, code: 'shop_media_delete_failed', message: res.error.message };
  return { deleted: true };
}
