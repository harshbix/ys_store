import { created, ok } from '../../utils/apiResponse.js';
import { createBuild, getBuild, setBuildComponent, removeBuildItem, validateBuild, addBuildToCart } from './service.js';

function getIdentity(req) {
  return {
    sessionToken: req.sessionToken,
    customerAuthId: req.customerAuthId || null
  };
}

export async function createBuildController(req, res, next) {
  try {
    const data = await createBuild(getIdentity(req), req.body);
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getBuildController(req, res, next) {
  try {
    const data = await getBuild(req.params.buildId, getIdentity(req));
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function upsertBuildItemController(req, res, next) {
  try {
    const data = await setBuildComponent(req.params.buildId, req.body, getIdentity(req));
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function deleteBuildItemController(req, res, next) {
  try {
    const data = await removeBuildItem(req.params.buildId, req.params.itemId, getIdentity(req));
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function validateBuildController(req, res, next) {
  try {
    const data = await validateBuild(req.params.buildId, req.body.auto_replace, getIdentity(req));
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function addBuildToCartController(req, res, next) {
  try {
    const data = await addBuildToCart(req.params.buildId, getIdentity(req));
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}
