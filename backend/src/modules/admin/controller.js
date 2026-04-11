import { ok, created } from '../../utils/apiResponse.js';
import {
  adminLogin,
  changeAdminPassword,
  deleteAdminUser,
  getAdminDashboardSummary,
  getAdminUsersSummary,
  getAdminActivityFeed,
  getAdminBuilds,
  getAdminBuildComponents,
  createAdminBuild,
  updateAdminBuild,
  deleteAdminBuild,
  getAdminProducts,
  getAdminProductDetail,
  createAdminProduct,
  updateAdminProduct,
  duplicateAdminProduct,
  quickEditAdminProduct,
  listAdminQuotes,
  setAdminQuoteStatus
} from './service.js';

export async function dashboardSummaryController(req, res, next) {
  try {
    const data = await getAdminDashboardSummary();
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function listUsersController(req, res, next) {
  try {
    const data = await getAdminUsersSummary({ query: req.query.q, limit: req.query.limit, page: req.query.page });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function listActivityController(req, res, next) {
  try {
    const data = await getAdminActivityFeed({ limit: req.query.limit, page: req.query.page });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function listBuildsController(req, res, next) {
  try {
    const data = await getAdminBuilds({ page: req.query.page, limit: req.query.limit });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function listBuildComponentsController(req, res, next) {
  try {
    const data = await getAdminBuildComponents({
      page: req.query.page,
      limit: req.query.limit,
      type: req.query.type
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function deleteUserController(req, res, next) {
  try {
    const data = await deleteAdminUser(req.params.id, req.admin.email);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function changePasswordController(req, res, next) {
  try {
    const data = await changeAdminPassword(req.admin.id, req.body.current_password, req.body.new_password);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function createBuildController(req, res, next) {
  try {
    const data = await createAdminBuild(req.body);
    return created(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function updateBuildController(req, res, next) {
  try {
    const data = await updateAdminBuild(req.params.id, req.body);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function deleteBuildController(req, res, next) {
  try {
    const data = await deleteAdminBuild(req.params.id);
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

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
    const data = await getAdminProducts({
      page: req.query.page,
      limit: req.query.limit,
      query: req.query.q
    });
    return ok(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getProductController(req, res, next) {
  try {
    const data = await getAdminProductDetail(req.params.id);
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
