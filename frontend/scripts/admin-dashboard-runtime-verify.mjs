import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BACKEND_BASE = process.env.ADMIN_VERIFY_BACKEND_BASE || 'http://127.0.0.1:4000/api';
const FRONTEND_BASE = process.env.ADMIN_VERIFY_FRONTEND_BASE || 'http://127.0.0.1:4173';
const ADMIN_EMAIL = process.env.PARITY_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'kidabixson@gmail.com';
const ADMIN_PASSWORD = process.env.PARITY_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'testing123';

const report = {
  started_at: new Date().toISOString(),
  backend_base: BACKEND_BASE,
  frontend_base: FRONTEND_BASE,
  api: {
    login: null,
    endpoint_checks: []
  },
  runtime: {
    flows: []
  },
  responsive: {
    screens: []
  },
  blockers: [],
  finished_at: null
};

let adminToken = '';
let adminUser = null;
let firstBuildComponent = null;

function hasSuccessShape(json) {
  return Boolean(json && typeof json === 'object' && json.success === true && 'data' in json);
}

function hasErrorShape(json) {
  return Boolean(
    json
    && typeof json === 'object'
    && json.success === false
    && typeof json.error_code === 'string'
    && typeof json.message === 'string'
  );
}

function pushBlocker(name, reason) {
  report.blockers.push({ name, reason });
}

function recordEndpoint(name, payload) {
  report.api.endpoint_checks.push({ name, ...payload });
  if (!payload.passed) {
    pushBlocker(name, payload.reason || 'Endpoint verification failed');
  }
}

function recordFlow(name, payload) {
  report.runtime.flows.push({ name, ...payload });
  if (!payload.passed) {
    pushBlocker(name, payload.reason || 'Runtime flow failed');
  }
}

function recordResponsive(label, payload) {
  report.responsive.screens.push({ label, ...payload });
  if (!payload.passed) {
    pushBlocker(`responsive:${label}`, payload.reason || 'Responsive check failed');
  }
}

async function parseJsonSafe(response) {
  const text = await response.text();
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

async function apiRequest(method, route, { body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${BACKEND_BASE}${route}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const parsed = await parseJsonSafe(response);
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    json: parsed.json,
    raw: parsed.text
  };
}

function randomSlug(prefix) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return `${prefix}-${suffix}`.toLowerCase();
}

function adminStorageState() {
  return { state: { token: adminToken, admin: adminUser }, version: 0 };
}

async function checkEndpointRead({
  name,
  method,
  route,
  successValidator,
  queryDesc
}) {
  const unauthorized = await apiRequest(method, route);
  const unauthorizedPass = [401, 403].includes(unauthorized.status) && hasErrorShape(unauthorized.json);

  const authorized = await apiRequest(method, route, { token: adminToken });
  const successShape = hasSuccessShape(authorized.json);
  const successValid = successShape && successValidator(authorized.json?.data);

  recordEndpoint(name, {
    method,
    route,
    request_shape: queryDesc || null,
    unauthorized_status: unauthorized.status,
    unauthorized_error_shape_ok: unauthorizedPass,
    authorized_status: authorized.status,
    authorized_success_shape_ok: successShape,
    authorized_payload_ok: successValid,
    passed: unauthorizedPass && authorized.status === 200 && successValid,
    reason: unauthorizedPass && authorized.status === 200 && successValid
      ? undefined
      : `Expected unauthorized 401/403 + authorized 200 valid payload. Got unauthorized=${unauthorized.status}, authorized=${authorized.status}`
  });

  return authorized.json?.data;
}

async function verifyApi() {
  const login = await apiRequest('POST', '/admin/login', {
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });

  const loginPassed = login.status === 200
    && hasSuccessShape(login.json)
    && typeof login.json?.data?.token === 'string'
    && login.json?.data?.token.length > 20;

  report.api.login = {
    status: login.status,
    passed: loginPassed,
    has_success_shape: hasSuccessShape(login.json),
    has_token: Boolean(login.json?.data?.token),
    reason: loginPassed ? undefined : 'Admin login failed; cannot proceed with authenticated checks.'
  };

  if (!loginPassed) {
    pushBlocker('api:admin_login', report.api.login.reason);
    return;
  }

  adminToken = login.json.data.token;
  adminUser = login.json.data.admin;

  const dashboardData = await checkEndpointRead({
    name: 'GET /admin/dashboard/summary',
    method: 'GET',
    route: '/admin/dashboard/summary',
    queryDesc: null,
    successValidator: (data) => {
      return data
        && typeof data === 'object'
        && data.stats
        && typeof data.stats.total_registered_users === 'number'
        && typeof data.stats.new_users_this_week === 'number'
        && Array.isArray(data.recent_activity)
        && Array.isArray(data.top_viewed_products)
        && Array.isArray(data.top_selected_builds);
    }
  });

  const usersData = await checkEndpointRead({
    name: 'GET /admin/users',
    method: 'GET',
    route: '/admin/users?limit=10',
    queryDesc: { limit: 'integer <= 100', q: 'optional string <= 120' },
    successValidator: (data) => {
      return data
        && typeof data.total_registered_users === 'number'
        && typeof data.new_users_this_week === 'number'
        && Array.isArray(data.recent_users);
    }
  });

  const activityData = await checkEndpointRead({
    name: 'GET /admin/activity',
    method: 'GET',
    route: '/admin/activity?limit=20',
    queryDesc: { limit: 'integer <= 200' },
    successValidator: (data) => Array.isArray(data)
  });

  const buildsData = await checkEndpointRead({
    name: 'GET /admin/builds',
    method: 'GET',
    route: '/admin/builds',
    queryDesc: null,
    successValidator: (data) => Array.isArray(data)
  });

  const componentsData = await checkEndpointRead({
    name: 'GET /admin/build-components',
    method: 'GET',
    route: '/admin/build-components',
    queryDesc: null,
    successValidator: (data) => Array.isArray(data)
  });

  firstBuildComponent = Array.isArray(componentsData) && componentsData.length > 0 ? componentsData[0] : null;

  const productsRead = await apiRequest('GET', '/admin/products', { token: adminToken });
  const productsUnauthorized = await apiRequest('GET', '/admin/products');
  const productsReadPassed = [401, 403].includes(productsUnauthorized.status)
    && hasErrorShape(productsUnauthorized.json)
    && productsRead.status === 200
    && hasSuccessShape(productsRead.json)
    && Array.isArray(productsRead.json.data);

  recordEndpoint('GET /admin/products', {
    method: 'GET',
    route: '/admin/products',
    request_shape: null,
    unauthorized_status: productsUnauthorized.status,
    unauthorized_error_shape_ok: [401, 403].includes(productsUnauthorized.status) && hasErrorShape(productsUnauthorized.json),
    authorized_status: productsRead.status,
    authorized_success_shape_ok: hasSuccessShape(productsRead.json),
    authorized_payload_ok: Array.isArray(productsRead.json?.data),
    passed: productsReadPassed,
    reason: productsReadPassed ? undefined : 'Products list auth or response shape check failed.'
  });

  if (!firstBuildComponent) {
    recordEndpoint('POST /admin/builds', {
      method: 'POST',
      route: '/admin/builds',
      request_shape: 'Requires at least one component item',
      passed: false,
      reason: 'No build components available, cannot verify build create/edit/delete endpoint behavior.'
    });
  } else {
    const buildId = randomSlug('verify-build');
    const buildCreatePayload = {
      id: buildId,
      name: `Runtime Verify Build ${Date.now()}`,
      cpu_family: String(firstBuildComponent.type || 'cpu').toUpperCase(),
      discount_percent: 0,
      status: 'draft',
      estimated_system_wattage: null,
      required_psu_wattage: null,
      compatibility_status: 'unknown',
      is_visible: true,
      items: [
        {
          slot_order: 0,
          component_type: firstBuildComponent.type,
          component_id: firstBuildComponent.id,
          quantity: 1
        }
      ]
    };

    const buildCreateUnauthorized = await apiRequest('POST', '/admin/builds', { body: buildCreatePayload });
    const buildCreate = await apiRequest('POST', '/admin/builds', { body: buildCreatePayload, token: adminToken });
    const buildCreatedId = buildCreate.json?.data?.id;
    const buildCreatePassed = [401, 403].includes(buildCreateUnauthorized.status)
      && hasErrorShape(buildCreateUnauthorized.json)
      && buildCreate.status === 201
      && hasSuccessShape(buildCreate.json)
      && typeof buildCreatedId === 'string';

    recordEndpoint('POST /admin/builds', {
      method: 'POST',
      route: '/admin/builds',
      request_shape: {
        id: 'optional string',
        name: 'string',
        cpu_family: 'string',
        items: 'array of {slot_order, component_type, component_id, quantity}'
      },
      unauthorized_status: buildCreateUnauthorized.status,
      unauthorized_error_shape_ok: [401, 403].includes(buildCreateUnauthorized.status) && hasErrorShape(buildCreateUnauthorized.json),
      authorized_status: buildCreate.status,
      authorized_success_shape_ok: hasSuccessShape(buildCreate.json),
      authorized_payload_ok: typeof buildCreatedId === 'string',
      passed: buildCreatePassed,
      reason: buildCreatePassed ? undefined : 'Build create endpoint failed auth or payload shape checks.'
    });

    if (buildCreatePassed) {
      const buildPatchPayload = {
        ...buildCreatePayload,
        name: `${buildCreatePayload.name} Updated`
      };

      const buildPatchUnauthorized = await apiRequest('PATCH', `/admin/builds/${buildCreatedId}`, { body: buildPatchPayload });
      const buildPatch = await apiRequest('PATCH', `/admin/builds/${buildCreatedId}`, { body: buildPatchPayload, token: adminToken });
      const buildPatchPassed = [401, 403].includes(buildPatchUnauthorized.status)
        && hasErrorShape(buildPatchUnauthorized.json)
        && buildPatch.status === 200
        && hasSuccessShape(buildPatch.json)
        && String(buildPatch.json?.data?.name || '').includes('Updated');

      recordEndpoint('PATCH /admin/builds/:id', {
        method: 'PATCH',
        route: '/admin/builds/:id',
        request_shape: 'Same body as POST /admin/builds',
        unauthorized_status: buildPatchUnauthorized.status,
        unauthorized_error_shape_ok: [401, 403].includes(buildPatchUnauthorized.status) && hasErrorShape(buildPatchUnauthorized.json),
        authorized_status: buildPatch.status,
        authorized_success_shape_ok: hasSuccessShape(buildPatch.json),
        authorized_payload_ok: String(buildPatch.json?.data?.name || '').includes('Updated'),
        passed: buildPatchPassed,
        reason: buildPatchPassed ? undefined : 'Build patch endpoint failed auth or payload checks.'
      });

      const buildDeleteUnauthorized = await apiRequest('DELETE', `/admin/builds/${buildCreatedId}`);
      const buildDelete = await apiRequest('DELETE', `/admin/builds/${buildCreatedId}`, { token: adminToken });
      const buildDeletePassed = [401, 403].includes(buildDeleteUnauthorized.status)
        && hasErrorShape(buildDeleteUnauthorized.json)
        && buildDelete.status === 200
        && hasSuccessShape(buildDelete.json)
        && buildDelete.json?.data?.deleted === true;

      recordEndpoint('DELETE /admin/builds/:id', {
        method: 'DELETE',
        route: '/admin/builds/:id',
        request_shape: null,
        unauthorized_status: buildDeleteUnauthorized.status,
        unauthorized_error_shape_ok: [401, 403].includes(buildDeleteUnauthorized.status) && hasErrorShape(buildDeleteUnauthorized.json),
        authorized_status: buildDelete.status,
        authorized_success_shape_ok: hasSuccessShape(buildDelete.json),
        authorized_payload_ok: buildDelete.json?.data?.deleted === true,
        passed: buildDeletePassed,
        reason: buildDeletePassed ? undefined : 'Build delete endpoint failed auth or payload checks.'
      });
    }
  }

  const productSlug = randomSlug('verify-product');
  const productPayload = {
    sku: `YS-${Math.floor(Math.random() * 900000 + 100000)}`,
    slug: productSlug,
    title: `Runtime Verify Product ${Date.now()}`,
    product_type: 'desktop',
    brand: 'YS',
    model_name: 'Runtime Verify Model',
    condition: 'new',
    stock_status: 'in_stock',
    estimated_price_tzs: 123456,
    short_description: 'Runtime verification product',
    long_description: 'Created during admin dashboard verification flow',
    warranty_text: null,
    is_visible: true,
    is_featured: false,
    featured_tag: null,
    specs: []
  };

  const createProductUnauthorized = await apiRequest('POST', '/admin/products', { body: productPayload });
  const createProduct = await apiRequest('POST', '/admin/products', { body: productPayload, token: adminToken });
  const createdProductId = createProduct.json?.data?.id;

  const createProductPassed = [401, 403].includes(createProductUnauthorized.status)
    && hasErrorShape(createProductUnauthorized.json)
    && createProduct.status === 201
    && hasSuccessShape(createProduct.json)
    && typeof createdProductId === 'string';

  recordEndpoint('POST /admin/products', {
    method: 'POST',
    route: '/admin/products',
    request_shape: 'Admin product payload with sku/slug/title/type/pricing/visibility/specs',
    unauthorized_status: createProductUnauthorized.status,
    unauthorized_error_shape_ok: [401, 403].includes(createProductUnauthorized.status) && hasErrorShape(createProductUnauthorized.json),
    authorized_status: createProduct.status,
    authorized_success_shape_ok: hasSuccessShape(createProduct.json),
    authorized_payload_ok: typeof createdProductId === 'string',
    passed: createProductPassed,
    reason: createProductPassed ? undefined : 'Product create endpoint failed auth or payload checks.'
  });

  if (createProductPassed) {
    const updatePayload = {
      ...productPayload,
      title: `${productPayload.title} Updated`
    };

    const updateUnauthorized = await apiRequest('PATCH', `/admin/products/${createdProductId}`, { body: updatePayload });
    const updateAuthorized = await apiRequest('PATCH', `/admin/products/${createdProductId}`, { body: updatePayload, token: adminToken });
    const updatePassed = [401, 403].includes(updateUnauthorized.status)
      && hasErrorShape(updateUnauthorized.json)
      && updateAuthorized.status === 200
      && hasSuccessShape(updateAuthorized.json)
      && String(updateAuthorized.json?.data?.title || '').includes('Updated');

    recordEndpoint('PATCH /admin/products/:id', {
      method: 'PATCH',
      route: '/admin/products/:id',
      request_shape: 'Same as POST /admin/products',
      unauthorized_status: updateUnauthorized.status,
      unauthorized_error_shape_ok: [401, 403].includes(updateUnauthorized.status) && hasErrorShape(updateUnauthorized.json),
      authorized_status: updateAuthorized.status,
      authorized_success_shape_ok: hasSuccessShape(updateAuthorized.json),
      authorized_payload_ok: String(updateAuthorized.json?.data?.title || '').includes('Updated'),
      passed: updatePassed,
      reason: updatePassed ? undefined : 'Product update endpoint failed auth or payload checks.'
    });

    const visibilityUnauthorized = await apiRequest('PATCH', `/admin/products/${createdProductId}/visibility`, {
      body: { is_visible: false }
    });
    const visibilityAuthorized = await apiRequest('PATCH', `/admin/products/${createdProductId}/visibility`, {
      body: { is_visible: false },
      token: adminToken
    });
    const visibilityPassed = [401, 403].includes(visibilityUnauthorized.status)
      && hasErrorShape(visibilityUnauthorized.json)
      && visibilityAuthorized.status === 200
      && hasSuccessShape(visibilityAuthorized.json)
      && visibilityAuthorized.json?.data?.is_visible === false;

    recordEndpoint('PATCH /admin/products/:id/visibility', {
      method: 'PATCH',
      route: '/admin/products/:id/visibility',
      request_shape: { is_visible: 'boolean' },
      unauthorized_status: visibilityUnauthorized.status,
      unauthorized_error_shape_ok: [401, 403].includes(visibilityUnauthorized.status) && hasErrorShape(visibilityUnauthorized.json),
      authorized_status: visibilityAuthorized.status,
      authorized_success_shape_ok: hasSuccessShape(visibilityAuthorized.json),
      authorized_payload_ok: visibilityAuthorized.json?.data?.is_visible === false,
      passed: visibilityPassed,
      reason: visibilityPassed ? undefined : 'Product visibility endpoint failed auth or payload checks.'
    });

    const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', 'base64');

    const uploadUrlUnauthorized = await apiRequest('POST', '/media/admin/upload-url', {
      body: {
        owner_type: 'product',
        owner_id: createdProductId,
        file_name: 'verify.png',
        content_type: 'image/png',
        variant: 'original'
      }
    });

    const variantPaths = {};
    let uploadSignedSuccess = true;

    for (const variant of ['original', 'thumb', 'full']) {
      const uploadUrlAuthorized = await apiRequest('POST', '/media/admin/upload-url', {
        token: adminToken,
        body: {
          owner_type: 'product',
          owner_id: createdProductId,
          file_name: `verify-${variant}.png`,
          content_type: 'image/png',
          variant
        }
      });

      const signedUrl = uploadUrlAuthorized.json?.data?.signed_url;
      const storagePath = uploadUrlAuthorized.json?.data?.path;

      const signedPass = uploadUrlAuthorized.status === 200
        && hasSuccessShape(uploadUrlAuthorized.json)
        && typeof signedUrl === 'string'
        && typeof storagePath === 'string';

      if (!signedPass) {
        uploadSignedSuccess = false;
      } else {
        const putResponse = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'image/png'
          },
          body: onePixelPng
        });

        if (!putResponse.ok) {
          uploadSignedSuccess = false;
        } else {
          variantPaths[variant] = storagePath;
        }
      }

      recordEndpoint(`POST /media/admin/upload-url (${variant})`, {
        method: 'POST',
        route: '/media/admin/upload-url',
        request_shape: {
          owner_type: 'product|shop',
          owner_id: 'uuid when owner_type=product',
          file_name: 'string',
          content_type: 'string',
          variant: 'original|thumb|full'
        },
        unauthorized_status: uploadUrlUnauthorized.status,
        unauthorized_error_shape_ok: [401, 403].includes(uploadUrlUnauthorized.status) && hasErrorShape(uploadUrlUnauthorized.json),
        authorized_status: uploadUrlAuthorized.status,
        authorized_success_shape_ok: hasSuccessShape(uploadUrlAuthorized.json),
        authorized_payload_ok: signedPass,
        passed: [401, 403].includes(uploadUrlUnauthorized.status) && hasErrorShape(uploadUrlUnauthorized.json) && signedPass,
        reason: signedPass ? undefined : `Upload URL (${variant}) did not return a valid signed URL/path.`
      });
    }

    const finalizeUnauthorized = await apiRequest('POST', '/media/admin/upload/finalize', {
      body: {
        owner_type: 'product',
        owner_id: createdProductId,
        original_path: variantPaths.original || 'missing',
        thumb_path: variantPaths.thumb || 'missing',
        full_path: variantPaths.full || 'missing',
        width: 1,
        height: 1,
        size_bytes: 68,
        is_primary: true,
        sort_order: 0
      }
    });

    if (!uploadSignedSuccess) {
      recordEndpoint('POST /media/admin/upload/finalize', {
        method: 'POST',
        route: '/media/admin/upload/finalize',
        request_shape: 'owner_type/owner_id/paths + optional metadata',
        unauthorized_status: finalizeUnauthorized.status,
        unauthorized_error_shape_ok: [401, 403].includes(finalizeUnauthorized.status) && hasErrorShape(finalizeUnauthorized.json),
        authorized_status: null,
        authorized_success_shape_ok: false,
        authorized_payload_ok: false,
        passed: false,
        reason: 'Upload URL or signed PUT failed, finalize cannot be validated.'
      });
    } else {
      const finalizeAuthorized = await apiRequest('POST', '/media/admin/upload/finalize', {
        token: adminToken,
        body: {
          owner_type: 'product',
          owner_id: createdProductId,
          original_path: variantPaths.original,
          thumb_path: variantPaths.thumb,
          full_path: variantPaths.full,
          width: 1,
          height: 1,
          size_bytes: 68,
          is_primary: true,
          sort_order: 0
        }
      });

      const finalizePass = [401, 403].includes(finalizeUnauthorized.status)
        && hasErrorShape(finalizeUnauthorized.json)
        && finalizeAuthorized.status === 201
        && hasSuccessShape(finalizeAuthorized.json)
        && String(finalizeAuthorized.json?.data?.product_id || '') === String(createdProductId);

      recordEndpoint('POST /media/admin/upload/finalize', {
        method: 'POST',
        route: '/media/admin/upload/finalize',
        request_shape: {
          owner_type: 'product|shop',
          owner_id: 'uuid for product',
          original_path: 'string',
          thumb_path: 'string',
          full_path: 'string',
          width: 'optional integer',
          height: 'optional integer',
          size_bytes: 'optional integer'
        },
        unauthorized_status: finalizeUnauthorized.status,
        unauthorized_error_shape_ok: [401, 403].includes(finalizeUnauthorized.status) && hasErrorShape(finalizeUnauthorized.json),
        authorized_status: finalizeAuthorized.status,
        authorized_success_shape_ok: hasSuccessShape(finalizeAuthorized.json),
        authorized_payload_ok: String(finalizeAuthorized.json?.data?.product_id || '') === String(createdProductId),
        passed: finalizePass,
        reason: finalizePass ? undefined : 'Finalize upload endpoint failed auth or response payload checks.'
      });
    }
  }

  // Keep references for runtime checks
  report.api.summary_snapshot = {
    total_registered_users: dashboardData?.stats?.total_registered_users,
    new_users_this_week: dashboardData?.stats?.new_users_this_week,
    products_count: Array.isArray(productsRead.json?.data) ? productsRead.json.data.length : null,
    activity_items: Array.isArray(activityData) ? activityData.length : null,
    builds_count: Array.isArray(buildsData) ? buildsData.length : null,
    users_recent_count: Array.isArray(usersData?.recent_users) ? usersData.recent_users.length : null
  };
}

async function selectSection(page, sectionName) {
  const sidebarButton = page.locator('aside button', { hasText: sectionName }).first();
  if (await sidebarButton.isVisible().catch(() => false)) {
    await sidebarButton.click();
    return true;
  }

  const topSelect = page.locator('header button[role="combobox"]').first();
  if (await topSelect.isVisible().catch(() => false)) {
    await topSelect.click();
    await page.getByRole('option', { name: sectionName }).click();
    return true;
  }

  return false;
}

async function verifyRuntimeUi() {
  if (!adminToken || !adminUser) {
    recordFlow('admin can access dashboard', {
      passed: false,
      reason: 'Missing admin token from API login.'
    });
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const artifactDir = path.resolve('test-results');
  fs.mkdirSync(artifactDir, { recursive: true });
  const uploadPath = path.join(artifactDir, `admin-upload-${Date.now()}.png`);
  fs.writeFileSync(uploadPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', 'base64'));

  const runtimeProductTitle = `Runtime UI Product ${Date.now()}`;
  let updatedProductTitle = `${runtimeProductTitle} Updated`;
  const runtimeBuildTitle = `Runtime UI Build ${Date.now()}`;
  const updatedBuildTitle = `${runtimeBuildTitle} Updated`;

  try {
    await page.goto(`${FRONTEND_BASE}/admin/login`, { waitUntil: 'networkidle' });
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });

    recordFlow('admin can access dashboard', {
      passed: true,
      details: {
        final_url: page.url()
      }
    });

    await page.getByText('Total Registered Users').first().waitFor({ state: 'visible', timeout: 15000 });
    const dashboardStatsVisible = await page.getByText('Total Registered Users').first().isVisible();
    recordFlow('dashboard stats load', {
      passed: dashboardStatsVisible,
      reason: dashboardStatsVisible ? undefined : 'Dashboard stat cards not visible.'
    });

    await selectSection(page, 'Users');
    await page.getByText('Total Registered Users').first().waitFor({ state: 'visible', timeout: 15000 });
    const usersCountText = await page.locator('section').filter({ hasText: 'Users' }).first().textContent();
    const usersCountLoaded = /Total Registered Users/i.test(String(usersCountText || ''));
    recordFlow('registered users count loads', {
      passed: usersCountLoaded,
      reason: usersCountLoaded ? undefined : 'Users count card not rendered in Users section.'
    });

    await selectSection(page, 'Products');
    await page.getByPlaceholder('Search products by title or SKU').waitFor({ state: 'visible', timeout: 15000 });

    const hasProductsCard = await page.locator('section').filter({ hasText: 'Products' }).getByRole('button', { name: 'Edit' }).count();
    const hasProductsEmpty = await page.getByText('No products yet').count();
    recordFlow('products list loads', {
      passed: hasProductsCard > 0 || hasProductsEmpty > 0,
      details: {
        edit_buttons: hasProductsCard,
        empty_state: hasProductsEmpty > 0
      },
      reason: hasProductsCard > 0 || hasProductsEmpty > 0 ? undefined : 'Neither products cards nor empty state appeared.'
    });

    await page.getByRole('button', { name: 'Upload new product' }).click();
    await page.getByPlaceholder('Gaming PC RTX 4060').fill(runtimeProductTitle);
    await page.getByPlaceholder('850000').fill('999999');
    await page.setInputFiles('input[type="file"]', uploadPath);

    const createProductResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/admin/products')
        && response.request().method() === 'POST';
    });

    const finalizeUploadResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/media/admin/upload/finalize')
        && response.request().method() === 'POST';
    });

    await page.getByRole('button', { name: 'Upload product' }).click();

    const createProductResponse = await createProductResponsePromise;
    const finalizeResponse = await finalizeUploadResponsePromise;

    const productUploadPassed = createProductResponse.status() === 201 && finalizeResponse.status() === 201;
    recordFlow('product upload works', {
      passed: productUploadPassed,
      details: {
        create_status: createProductResponse.status(),
        finalize_status: finalizeResponse.status()
      },
      reason: productUploadPassed ? undefined : 'Product create or media finalize response was not successful.'
    });

    await page.getByPlaceholder('Search products by title or SKU').fill(runtimeProductTitle);
    await page.getByText(runtimeProductTitle).first().waitFor({ state: 'visible', timeout: 15000 });

    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByPlaceholder('Gaming PC RTX 4060').fill(updatedProductTitle);

    const updateProductResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/admin/products/')
        && response.request().method() === 'PATCH'
        && !response.url().includes('/visibility');
    });

    await page.getByRole('button', { name: 'Save product' }).click();
    const updateProductResponse = await updateProductResponsePromise;

    const productEditPassed = updateProductResponse.status() === 200;
    recordFlow('product edit works', {
      passed: productEditPassed,
      details: { update_status: updateProductResponse.status() },
      reason: productEditPassed ? undefined : 'Product update endpoint did not return success.'
    });

    await page.getByPlaceholder('Search products by title or SKU').fill(updatedProductTitle);
    await page.getByText(updatedProductTitle).first().waitFor({ state: 'visible', timeout: 15000 });

    await page.getByRole('button', { name: 'Delete' }).first().click();

    const visibilityResponsePromise = page.waitForResponse((response) => {
      return response.url().includes('/api/admin/products/')
        && response.url().includes('/visibility')
        && response.request().method() === 'PATCH';
    });

    await page.getByRole('button', { name: 'Confirm delete' }).click();
    const visibilityResponse = await visibilityResponsePromise;

    const productDeletePassed = visibilityResponse.status() === 200;
    recordFlow('product delete works', {
      passed: productDeletePassed,
      details: { visibility_status: visibilityResponse.status() },
      reason: productDeletePassed ? undefined : 'Product visibility archive endpoint failed.'
    });

    await selectSection(page, 'Builds');
    const hasBuildCards = await page.getByRole('button', { name: 'Edit' }).count();
    const hasBuildEmpty = await page.getByText('No builds yet').count();
    recordFlow('builds list loads', {
      passed: hasBuildCards > 0 || hasBuildEmpty > 0,
      details: { edit_buttons: hasBuildCards, empty_state: hasBuildEmpty > 0 },
      reason: hasBuildCards > 0 || hasBuildEmpty > 0 ? undefined : 'Neither build cards nor empty state rendered.'
    });

    await page.getByRole('button', { name: 'Create build' }).click();
    const buildDialog = page.locator('[role="dialog"]').first();
    await buildDialog.waitFor({ state: 'visible', timeout: 15000 });

    await buildDialog.getByPlaceholder('Creator Pro Build').fill(runtimeBuildTitle);
    await buildDialog.getByPlaceholder('Intel Core i7').fill(String(firstBuildComponent?.type || 'cpu').toUpperCase());
    await buildDialog.getByPlaceholder('cpu').fill(String(firstBuildComponent?.type || 'cpu'));

    const comboCount = await buildDialog.locator('button[role="combobox"]').count();
    if (comboCount < 2) {
      recordFlow('build create works', {
        passed: false,
        reason: 'Expected build status and component comboboxes inside build form.'
      });
    } else {
      await buildDialog.locator('button[role="combobox"]').nth(comboCount - 1).click();
      const componentOption = page.locator('[role="option"]').filter({ hasNotText: 'Select component' }).first();
      await componentOption.click();

      const buildCreateResponsePromise = page.waitForResponse((response) => {
        return response.url().includes('/api/admin/builds')
          && response.request().method() === 'POST';
      });

      await buildDialog.getByRole('button', { name: 'Create build' }).click();
      const buildCreateResponse = await buildCreateResponsePromise;

      const buildCreatePassed = buildCreateResponse.status() === 201;
      recordFlow('build create works', {
        passed: buildCreatePassed,
        details: { create_status: buildCreateResponse.status() },
        reason: buildCreatePassed ? undefined : 'Build create endpoint did not return success.'
      });

      await page.getByText(runtimeBuildTitle).first().waitFor({ state: 'visible', timeout: 15000 });

      const buildCardForEdit = page.getByText(runtimeBuildTitle).first().locator('xpath=ancestor::div[contains(@class,"p-4")][1]');
      await buildCardForEdit.getByRole('button', { name: 'Edit' }).click();

      const editDialog = page.locator('[role="dialog"]').first();
      await editDialog.waitFor({ state: 'visible', timeout: 15000 });
      await editDialog.getByPlaceholder('Creator Pro Build').fill(updatedBuildTitle);

      const buildPatchResponsePromise = page.waitForResponse((response) => {
        return response.url().includes('/api/admin/builds/')
          && response.request().method() === 'PATCH';
      });

      await editDialog.getByRole('button', { name: 'Save build' }).click();
      const buildPatchResponse = await buildPatchResponsePromise;
      const buildEditPassed = buildPatchResponse.status() === 200;

      recordFlow('build edit works', {
        passed: buildEditPassed,
        details: { patch_status: buildPatchResponse.status() },
        reason: buildEditPassed ? undefined : 'Build patch endpoint did not return success.'
      });

      await page.getByText(updatedBuildTitle).first().waitFor({ state: 'visible', timeout: 15000 });
      const buildCardForDelete = page.getByText(updatedBuildTitle).first().locator('xpath=ancestor::div[contains(@class,"p-4")][1]');
      await buildCardForDelete.getByRole('button', { name: 'Delete' }).click();

      const buildDeleteResponsePromise = page.waitForResponse((response) => {
        return response.url().includes('/api/admin/builds/')
          && response.request().method() === 'DELETE';
      });

      await page.getByRole('button', { name: 'Confirm delete' }).click();
      const buildDeleteResponse = await buildDeleteResponsePromise;
      const buildDeletePassed = buildDeleteResponse.status() === 200;

      recordFlow('build delete works', {
        passed: buildDeletePassed,
        details: { delete_status: buildDeleteResponse.status() },
        reason: buildDeletePassed ? undefined : 'Build delete endpoint did not return success.'
      });
    }

    await selectSection(page, 'Activity');
    const hasActivityList = await page.locator('section').filter({ hasText: 'Activity' }).locator('div.rounded-lg').count();
    const hasActivityEmpty = await page.getByText('No activity yet').count();
    const activityPassed = hasActivityList > 0 || hasActivityEmpty > 0;

    recordFlow('activity feed loads', {
      passed: activityPassed,
      details: { activity_items: hasActivityList, empty_state: hasActivityEmpty > 0 },
      reason: activityPassed ? undefined : 'Activity section did not render list or empty state.'
    });

    // Loading state check via delayed summary request
    {
      const loadContext = await browser.newContext({ viewport: { width: 1200, height: 900 } });
      await loadContext.addInitScript((payload) => {
        localStorage.setItem('ys-admin-auth', JSON.stringify(payload));
      }, adminStorageState());

      await loadContext.route('**/api/admin/dashboard/summary', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1600));
        await route.continue();
      });

      await loadContext.route('**/api/admin/me', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2200));
        await route.continue();
      });

      const loadPage = await loadContext.newPage();
      await loadPage.goto(`${FRONTEND_BASE}/admin`, { waitUntil: 'domcontentloaded' });
      const skeletonVisible = await loadPage.locator('.animate-spin').first().isVisible({ timeout: 4000 }).catch(() => false);
      recordFlow('loading states render properly', {
        passed: skeletonVisible,
        reason: skeletonVisible ? undefined : 'Loading spinner did not render during delayed admin session verification.'
      });

      await loadContext.close();
    }

    // Empty state check by stubbing responses
    {
      const emptyContext = await browser.newContext({ viewport: { width: 1200, height: 900 } });
      await emptyContext.addInitScript((payload) => {
        localStorage.setItem('ys-admin-auth', JSON.stringify(payload));
      }, adminStorageState());

      await emptyContext.route('**/api/admin/dashboard/summary', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              stats: {
                total_registered_users: 0,
                new_users_this_week: 0,
                total_products: 0,
                total_builds: 0,
                whatsapp_checkout_clicks: 0,
                low_stock_items: 0
              },
              recent_activity: [],
              top_viewed_products: [],
              top_selected_builds: [],
              generated_at: new Date().toISOString()
            }
          })
        });
      });

      await emptyContext.route('**/api/admin/products', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'OK', data: [] })
        });
      });

      await emptyContext.route('**/api/admin/builds', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'OK', data: [] })
        });
      });

      await emptyContext.route('**/api/admin/build-components', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'OK', data: [] })
        });
      });

      await emptyContext.route('**/api/admin/users?*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              total_registered_users: 0,
              new_users_this_week: 0,
              recent_users: []
            }
          })
        });
      });

      await emptyContext.route('**/api/admin/activity?*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'OK', data: [] })
        });
      });

      const emptyPage = await emptyContext.newPage();
      await emptyPage.goto(`${FRONTEND_BASE}/admin`, { waitUntil: 'networkidle' });
      const dashboardEmptyVisible = await emptyPage.getByText('No activity yet').first().isVisible().catch(() => false);
      await selectSection(emptyPage, 'Products');
      const productsEmptyVisible = await emptyPage.getByText('No products yet').first().isVisible().catch(() => false);
      await selectSection(emptyPage, 'Builds');
      const buildsEmptyVisible = await emptyPage.getByText('No builds yet').first().isVisible().catch(() => false);
      await selectSection(emptyPage, 'Users');
      const usersEmptyVisible = await emptyPage.getByText('No registered users').first().isVisible().catch(() => false);

      const emptyStatesPassed = dashboardEmptyVisible && productsEmptyVisible && buildsEmptyVisible && usersEmptyVisible;
      recordFlow('empty states render properly', {
        passed: emptyStatesPassed,
        details: {
          dashboard_empty: dashboardEmptyVisible,
          products_empty: productsEmptyVisible,
          builds_empty: buildsEmptyVisible,
          users_empty: usersEmptyVisible
        },
        reason: emptyStatesPassed ? undefined : 'One or more required empty states did not render under empty API responses.'
      });

      await emptyContext.close();
    }

    // Error state check by forcing dashboard summary failure
    {
      const errorContext = await browser.newContext({ viewport: { width: 1200, height: 900 } });
      await errorContext.addInitScript((payload) => {
        localStorage.setItem('ys-admin-auth', JSON.stringify(payload));
      }, adminStorageState());

      await errorContext.route('**/api/admin/dashboard/summary', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error_code: 'internal_error',
            message: 'Forced verification error',
            details: null
          })
        });
      });

      const errorPage = await errorContext.newPage();
      await errorPage.goto(`${FRONTEND_BASE}/admin`, { waitUntil: 'networkidle' });
      const dashboardErrorVisible = await errorPage.getByText('Dashboard unavailable').first().isVisible().catch(() => false);

      recordFlow('error states render properly', {
        passed: dashboardErrorVisible,
        reason: dashboardErrorVisible ? undefined : 'Dashboard error state did not render when summary endpoint returned 500.'
      });

      await errorContext.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordFlow('runtime smoke execution', {
      passed: false,
      reason: message
    });
  } finally {
    if (fs.existsSync(uploadPath)) {
      fs.unlinkSync(uploadPath);
    }

    await context.close();
    await browser.close();
  }
}

async function verifyResponsive() {
  if (!adminToken || !adminUser) {
    recordResponsive('prerequisite', {
      passed: false,
      reason: 'Missing admin token from API login.'
    });
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const sizes = [
    { label: '360px', width: 360, height: 800 },
    { label: '390px', width: 390, height: 844 },
    { label: 'tablet', width: 768, height: 1024 },
    { label: 'narrow-laptop', width: 1024, height: 768 }
  ];

  try {
    for (const size of sizes) {
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
      await context.addInitScript((payload) => {
        localStorage.setItem('ys-admin-auth', JSON.stringify(payload));
      }, adminStorageState());

      const page = await context.newPage();
      await page.goto(`${FRONTEND_BASE}/admin`, { waitUntil: 'networkidle' });

      const noHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth + 1;
      });

      const navWorks = await selectSection(page, 'Products');
      let panelFits = false;
      let touchFriendly = false;
      let primaryActionVisible = false;

      if (navWorks) {
        const uploadButton = page.getByRole('button', { name: 'Upload new product' }).first();
        primaryActionVisible = await uploadButton.isVisible().catch(() => false);
        if (primaryActionVisible) {
          await uploadButton.click();
          const panel = page.locator('[role="dialog"]').first();
          await panel.waitFor({ state: 'visible', timeout: 15000 });
          const box = await panel.boundingBox();
          panelFits = Boolean(box && box.width <= size.width + 4 && box.height <= size.height + 16);

          const primaryButton = panel.getByRole('button', { name: /Upload product|Save product/ }).first();
          if (await primaryButton.count()) {
            const btnBox = await primaryButton.boundingBox();
            touchFriendly = Boolean(btnBox && btnBox.height >= 40);
          }

          const cancelButton = panel.getByRole('button', { name: 'Cancel' }).first();
          if (await cancelButton.count()) {
            await cancelButton.click();
          }
        }
      }

      const passed = noHorizontalScroll && navWorks && panelFits && touchFriendly && primaryActionVisible;
      recordResponsive(size.label, {
        width: size.width,
        height: size.height,
        no_horizontal_scroll: noHorizontalScroll,
        navigation_works: navWorks,
        panel_fits_viewport: panelFits,
        touch_friendly_actions: touchFriendly,
        primary_action_obvious: primaryActionVisible,
        passed,
        reason: passed
          ? undefined
          : `Checks failed: scroll=${noHorizontalScroll}, nav=${navWorks}, panel=${panelFits}, touch=${touchFriendly}, primary=${primaryActionVisible}`
      });

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    await verifyApi();
    await verifyRuntimeUi();
    await verifyResponsive();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    pushBlocker('verification-runner', message);
  } finally {
    report.finished_at = new Date().toISOString();
  }

  const outputDir = path.resolve('test-results');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'admin-dashboard-runtime-verification.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log('ADMIN_DASHBOARD_VERIFICATION_REPORT');
  console.log(JSON.stringify(report, null, 2));
  console.log(`REPORT_FILE:${outputPath}`);

  const hasFailures = report.blockers.length > 0
    || report.api.endpoint_checks.some((entry) => !entry.passed)
    || report.runtime.flows.some((entry) => !entry.passed)
    || report.responsive.screens.some((entry) => !entry.passed);

  if (hasFailures) {
    process.exitCode = 1;
  }
}

await main();
