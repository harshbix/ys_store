import { ok } from '../../utils/apiResponse.js';
import { searchProducts, getProductDetail, getFilterOptions, compareProducts } from './service.js';

export async function listProducts(req, res, next) {
  try {
    const data = await searchProducts(req.query);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getProductBySlug(req, res, next) {
  try {
    const data = await getProductDetail(req.params.slug);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getFilterOptionsController(req, res, next) {
  try {
    const data = await getFilterOptions(req.query.type);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function compareProductsController(req, res, next) {
  try {
    const data = await compareProducts(req.body.product_ids);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}
