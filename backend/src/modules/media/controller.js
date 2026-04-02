import { ok, created } from '../../utils/apiResponse.js';
import { uploadMedia, getShopMedia, updateShopMediaItem, removeShopMediaItem } from './service.js';

export async function uploadMediaController(req, res, next) {
  try {
    const data = await uploadMedia(req.body);
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function listShopMediaController(req, res, next) {
  try {
    const data = await getShopMedia();
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function updateShopMediaController(req, res, next) {
  try {
    const data = await updateShopMediaItem(req.params.id, req.body);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function deleteShopMediaController(req, res, next) {
  try {
    const data = await removeShopMediaItem(req.params.id);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}
