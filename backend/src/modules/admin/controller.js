import { ok, created } from '../../utils/apiResponse.js';
import {
  adminLogin,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  duplicateAdminProduct,
  quickEditAdminProduct,
  listAdminQuotes,
  setAdminQuoteStatus
} from './service.js';

export async function loginController(req, res, next) {
  try {
    const data = await adminLogin(req.body.email, req.body.password);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function logoutController(req, res) {
  return ok(res, { logged_out: true });
}

export async function meController(req, res) {
  return ok(res, { admin: req.admin });
}

export async function listProductsController(req, res, next) {
  try {
    const data = await getAdminProducts();
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function createProductController(req, res, next) {
  try {
    const data = await createAdminProduct(req.body, req.admin.sub);
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function updateProductController(req, res, next) {
  try {
    const data = await updateAdminProduct(req.params.id, req.body);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function duplicateProductController(req, res, next) {
  try {
    const data = await duplicateAdminProduct(req.params.id, req.admin.sub);
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function updateStockController(req, res, next) {
  try {
    const data = await quickEditAdminProduct(req.params.id, { stock_status: req.body.stock_status });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function updateVisibilityController(req, res, next) {
  try {
    const data = await quickEditAdminProduct(req.params.id, { is_visible: req.body.is_visible });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function quickEditController(req, res, next) {
  try {
    const data = await quickEditAdminProduct(req.params.id, req.body);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function listQuotesController(req, res, next) {
  try {
    const data = await listAdminQuotes();
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function updateQuoteStatusController(req, res, next) {
  try {
    const data = await setAdminQuoteStatus(req.params.id, req.body);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}
