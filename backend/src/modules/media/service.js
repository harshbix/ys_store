import {
  insertProductMedia,
  listShopMedia,
  insertShopMedia,
  updateShopMedia,
  deleteShopMedia
} from './repository.js';

export async function uploadMedia(payload) {
  if (payload.owner_type === 'product') {
    const res = await insertProductMedia({
      product_id: payload.owner_id,
      original_url: payload.original_url,
      thumb_url: payload.thumb_url,
      full_url: payload.full_url,
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
    original_url: payload.original_url,
    thumb_url: payload.thumb_url,
    full_url: payload.full_url,
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
