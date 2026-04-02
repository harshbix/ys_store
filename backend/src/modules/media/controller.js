import { ok, created } from '../../utils/apiResponse.js';
import {
  createUploadUrl,
  finalizeUpload,
  getShopMedia,
  updateShopMediaItem,
  removeShopMediaItem
} from './service.js';

export async function createUploadUrlController(req, res, next) {
  try {
    const data = await createUploadUrl(req.body);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function finalizeUploadController(req, res, next) {
  try {
    const data = await finalizeUpload(req.body);
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
