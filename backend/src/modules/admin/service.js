import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { verifyPassword } from '../../utils/password.js';
import {
  countBuildPresets,
  countLowStockProducts,
  countProducts,
  countWhatsappClicks,
  createBuildPreset,
  findAdminByEmail,
  findBuildComponentsByIds,
  findBuildPresetById,
  findCustomBuildsByIds,
  findProductsByIds,
  listProductsAdmin,
  listAllAuthUsers,
  listBuildComponentsAdmin,
  listBuildPresetsAdmin,
  listBuildSelectionEvents,
  listRecentAnalyticsEvents,
  listRecentBuildPresets,
  listRecentProducts,
  listRecentQuotes,
  listTopViewedProductEvents,
  findSpecDefinitionKeys,
  createProduct,
  deleteBuildPreset,
  updateProduct,
  findProductById,
  listProductSpecs,
  listProductMedia,
  replaceProductSpecs,
  listQuotesAdmin,
  replaceBuildPresetItems,
  updateBuildPreset,
  updateQuoteStatus
} from './repository.js';

function assertSpecKeysAllowed(specs, allowedKeys) {
  for (const s of specs) {
    if (!allowedKeys.has(s.spec_key)) {
      throw { status: 400, code: 'invalid_spec_key', message: `Unknown spec_key: ${s.spec_key}` };
    }
  }
}

export async function adminLogin(email, password) {
  if (!email || !password) {
    throw { status: 400, code: 'invalid_request', message: 'Email and password are required' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // 1. Check if email is in allowed list
  const allowedEmails = env.allowedAdminEmails || [];
  if (!allowedEmails.includes(normalizedEmail)) {
    console.warn('[Admin Login] Unauthorized email attempted:', normalizedEmail);
    throw { status: 401, code: 'invalid_credentials', message: 'Invalid admin credentials' };
  }

  // 2. Look up admin record
  const adminRes = await findAdminByEmail(normalizedEmail);
  if (adminRes.error) {
    throw { status: 500, code: 'admin_lookup_failed', message: adminRes.error.message };
  }
  if (!adminRes.data) {
    console.warn('[Admin Login] Admin record not found for email:', normalizedEmail);
    throw { status: 403, code: 'admin_not_bootstrapped', message: 'Admin profile not initialized' };
  }

  const admin = adminRes.data;

  // 3. Verify password
  if (!admin.password_hash) {
    console.warn('[Admin Login] Admin record exists but has no password hash:', normalizedEmail);
    throw { status: 403, code: 'admin_auth_not_configured', message: 'Admin password authentication not configured' };
  }

  const passwordValid = verifyPassword(password, admin.password_hash);
  if (!passwordValid) {
    console.warn('[Admin Login] Password verification failed for:', normalizedEmail);
    throw { status: 401, code: 'invalid_credentials', message: 'Invalid admin credentials' };
  }

  // 4. Sign and return JWT
  const token = jwt.sign(
    { sub: admin.id, email: admin.email, role: admin.role },
    env.adminJwtSecret,
    { expiresIn: env.adminJwtExpiresIn }
  );

  return { token, admin };
}

function toMillis(value) {
  const millis = Date.parse(String(value || ''));
  return Number.isNaN(millis) ? 0 : millis;
}

function withinLastDays(value, days) {
  if (!value) return false;
  const boundary = Date.now() - days * 24 * 60 * 60 * 1000;
  return toMillis(value) >= boundary;
}

function clampNumber(value, min, max, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizePresetId(inputId, nameFallback) {
  const raw = String(inputId || nameFallback || '').trim().toLowerCase();
  const slug = raw
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return slug || `preset-${Date.now()}`;
}

async function fetchAuthUsersOrThrow() {
  const usersRes = await listAllAuthUsers();
  if (usersRes.error) {
    throw { status: 500, code: 'users_lookup_failed', message: usersRes.error.message };
  }
  return usersRes.data || [];
}

function mapAuthUser(user) {
  return {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    full_name: user.user_metadata?.full_name || null,
    created_at: user.created_at,
    last_active_at: user.last_sign_in_at || null,
    is_email_confirmed: Boolean(user.email_confirmed_at)
  };
}

function analyticsTitle(eventName) {
  if (eventName === 'product_view') return 'Product viewed';
  if (eventName === 'add_to_cart') return 'Product added to cart';
  if (eventName === 'build_created') return 'Custom build started';
  if (eventName === 'quote_created') return 'Quote created';
  if (eventName === 'whatsapp_click') return 'WhatsApp checkout clicked';
  if (eventName === 'whatsapp_click_initiated') return 'WhatsApp checkout initiated';
  return 'Activity recorded';
}

async function buildTopViewedProducts() {
  const viewedRes = await listTopViewedProductEvents();
  if (viewedRes.error) {
    throw { status: 500, code: 'top_viewed_failed', message: viewedRes.error.message };
  }

  const counts = new Map();
  for (const row of viewedRes.data || []) {
    if (!row.product_id) continue;
    counts.set(row.product_id, (counts.get(row.product_id) || 0) + 1);
  }

  const sortedIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  const productsRes = await findProductsByIds(sortedIds);
  if (productsRes.error) {
    throw { status: 500, code: 'top_viewed_products_failed', message: productsRes.error.message };
  }

  const productsById = new Map((productsRes.data || []).map((product) => [product.id, product]));

  return sortedIds.map((productId) => {
    const product = productsById.get(productId);
    return {
      product_id: productId,
      title: product?.title || 'Unknown product',
      slug: product?.slug || null,
      views: counts.get(productId) || 0,
      estimated_price_tzs: product?.estimated_price_tzs || 0
    };
  });
}

async function buildTopSelectedBuilds() {
  const eventsRes = await listBuildSelectionEvents();
  if (eventsRes.error) {
    throw { status: 500, code: 'top_build_events_failed', message: eventsRes.error.message };
  }

  const counts = new Map();
  for (const row of eventsRes.data || []) {
    if (!row.custom_build_id) continue;
    counts.set(row.custom_build_id, (counts.get(row.custom_build_id) || 0) + 1);
  }

  const sortedIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  const buildsRes = await findCustomBuildsByIds(sortedIds);
  if (buildsRes.error) {
    throw { status: 500, code: 'top_builds_failed', message: buildsRes.error.message };
  }

  const buildsById = new Map((buildsRes.data || []).map((build) => [build.id, build]));

  return sortedIds.map((buildId) => {
    const build = buildsById.get(buildId);
    return {
      build_id: buildId,
      build_code: build?.build_code || null,
      name: build?.name || 'Custom Build',
      selections: counts.get(buildId) || 0,
      total_estimated_price_tzs: build?.total_estimated_price_tzs || 0
    };
  });
}

async function collectRecentActivity(limit, authUsers) {
  const [analyticsRes, quotesRes, productsRes, buildsRes] = await Promise.all([
    listRecentAnalyticsEvents(limit),
    listRecentQuotes(Math.ceil(limit / 2)),
    listRecentProducts(Math.ceil(limit / 2)),
    listRecentBuildPresets(Math.ceil(limit / 2))
  ]);

  if (analyticsRes.error) throw { status: 500, code: 'activity_analytics_failed', message: analyticsRes.error.message };
  if (quotesRes.error) throw { status: 500, code: 'activity_quotes_failed', message: quotesRes.error.message };
  if (productsRes.error) throw { status: 500, code: 'activity_products_failed', message: productsRes.error.message };
  if (buildsRes.error) throw { status: 500, code: 'activity_builds_failed', message: buildsRes.error.message };

  const analyticsItems = (analyticsRes.data || []).map((event) => ({
    id: `analytics-${event.id}`,
    type: 'analytics',
    title: analyticsTitle(event.event_name),
    description: event.page_path || null,
    occurred_at: event.created_at
  }));

  const quoteItems = (quotesRes.data || []).map((quote) => ({
    id: `quote-${quote.id}`,
    type: 'quote',
    title: `Quote ${quote.quote_code} is ${quote.status.replace(/_/g, ' ')}`,
    description: quote.customer_name || null,
    occurred_at: quote.updated_at || quote.created_at
  }));

  const productItems = (productsRes.data || []).map((product) => ({
    id: `product-${product.id}`,
    type: 'product',
    title: `Product updated: ${product.title}`,
    description: product.stock_status?.replace(/_/g, ' ') || null,
    occurred_at: product.updated_at || product.created_at
  }));

  const buildItems = (buildsRes.data || []).map((preset) => ({
    id: `preset-${preset.id}`,
    type: 'build',
    title: `Build preset updated: ${preset.name}`,
    description: preset.status || null,
    occurred_at: preset.updated_at || preset.created_at
  }));

  const userItems = (authUsers || []).slice(0, limit).map((user) => {
    const mapped = mapAuthUser(user);
    return {
      id: `user-${mapped.id}`,
      type: 'user',
      title: `User registered: ${mapped.email || mapped.phone || 'Unknown'}`,
      description: mapped.full_name || null,
      occurred_at: mapped.created_at
    };
  });

  return [...analyticsItems, ...quoteItems, ...productItems, ...buildItems, ...userItems]
    .sort((a, b) => toMillis(b.occurred_at) - toMillis(a.occurred_at))
    .slice(0, limit);
}

async function prepareBuildPayload(payload, presetIdOverride = null) {
  const normalizedItems = Array.isArray(payload.items) ? payload.items : [];
  if (!normalizedItems.length) {
    throw { status: 400, code: 'build_items_required', message: 'At least one build item is required' };
  }

  const componentIds = [...new Set(normalizedItems.map((item) => item.component_id).filter(Boolean))];
  const componentsRes = await findBuildComponentsByIds(componentIds);
  if (componentsRes.error) {
    throw { status: 500, code: 'build_components_lookup_failed', message: componentsRes.error.message };
  }

  const componentsById = new Map((componentsRes.data || []).map((component) => [component.id, component]));
  const usedSlots = new Set();

  const items = normalizedItems.map((item, index) => {
    const component = componentsById.get(item.component_id);
    if (!component) {
      throw {
        status: 400,
        code: 'build_component_missing',
        message: `Unknown component selected at row ${index + 1}`
      };
    }

    const slotOrder = Number(item.slot_order);
    if (usedSlots.has(slotOrder)) {
      throw { status: 400, code: 'build_slot_duplicate', message: `Duplicate slot order: ${slotOrder}` };
    }
    usedSlots.add(slotOrder);

    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(component.price_tzs) || 0;

    return {
      slot_order: slotOrder,
      component_type: item.component_type || component.type,
      component_id: component.id,
      quantity,
      unit_price_tzs: unitPrice,
      line_total_tzs: unitPrice * quantity
    };
  }).sort((a, b) => a.slot_order - b.slot_order);

  const subtotal = items.reduce((acc, item) => acc + Number(item.line_total_tzs || 0), 0);
  const discountPercent = clampNumber(payload.discount_percent, 0, 99.99, 0);
  const total = Math.max(0, Math.round(subtotal - (subtotal * discountPercent) / 100));

  const presetId = presetIdOverride || normalizePresetId(payload.id, payload.name);

  return {
    preset: {
      id: presetId,
      name: payload.name,
      cpu_family: payload.cpu_family,
      build_number: payload.build_number ?? null,
      subtotal_tzs: subtotal,
      discount_percent: discountPercent,
      total_tzs: total,
      status: payload.status || 'draft',
      estimated_system_wattage: payload.estimated_system_wattage ?? null,
      required_psu_wattage: payload.required_psu_wattage ?? null,
      compatibility_status: payload.compatibility_status || 'unknown',
      is_visible: payload.is_visible !== false,
      updated_at: new Date().toISOString()
    },
    items
  };
}

export async function getAdminDashboardSummary() {
  const [productCountRes, lowStockCountRes, buildCountRes, whatsappCountRes, authUsers] = await Promise.all([
    countProducts(),
    countLowStockProducts(),
    countBuildPresets(),
    countWhatsappClicks(),
    fetchAuthUsersOrThrow()
  ]);

  if (productCountRes.error) throw { status: 500, code: 'dashboard_products_count_failed', message: productCountRes.error.message };
  if (lowStockCountRes.error) throw { status: 500, code: 'dashboard_low_stock_failed', message: lowStockCountRes.error.message };
  if (buildCountRes.error) throw { status: 500, code: 'dashboard_builds_count_failed', message: buildCountRes.error.message };
  if (whatsappCountRes.error) throw { status: 500, code: 'dashboard_whatsapp_count_failed', message: whatsappCountRes.error.message };

  const mappedUsers = authUsers.map(mapAuthUser).sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
  const newUsersThisWeek = mappedUsers.filter((user) => withinLastDays(user.created_at, 7)).length;

  const [topViewedProducts, topBuilds, recentActivity] = await Promise.all([
    buildTopViewedProducts(),
    buildTopSelectedBuilds(),
    collectRecentActivity(40, authUsers)
  ]);

  return {
    stats: {
      total_registered_users: mappedUsers.length,
      new_users_this_week: newUsersThisWeek,
      total_products: productCountRes.count || 0,
      total_builds: buildCountRes.count || 0,
      whatsapp_checkout_clicks: whatsappCountRes.count || 0,
      low_stock_items: lowStockCountRes.count || 0
    },
    recent_activity: recentActivity,
    top_viewed_products: topViewedProducts,
    top_selected_builds: topBuilds,
    generated_at: new Date().toISOString()
  };
}

export async function getAdminUsersSummary({ query, limit = 20 } = {}) {
  const authUsers = await fetchAuthUsersOrThrow();
  const mappedUsers = authUsers.map(mapAuthUser).sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));

  const normalizedQuery = String(query || '').trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? mappedUsers.filter((user) => {
      const email = String(user.email || '').toLowerCase();
      const phone = String(user.phone || '').toLowerCase();
      return email.includes(normalizedQuery) || phone.includes(normalizedQuery);
    })
    : mappedUsers;

  return {
    total_registered_users: mappedUsers.length,
    new_users_this_week: mappedUsers.filter((user) => withinLastDays(user.created_at, 7)).length,
    recent_users: filteredUsers.slice(0, Number(limit) || 20)
  };
}

export async function getAdminActivityFeed({ limit = 40 } = {}) {
  const authUsers = await fetchAuthUsersOrThrow();
  return collectRecentActivity(Number(limit) || 40, authUsers);
}

export async function getAdminBuilds() {
  const res = await listBuildPresetsAdmin();
  if (res.error) throw { status: 500, code: 'builds_list_failed', message: res.error.message };
  return res.data || [];
}

export async function getAdminBuildComponents() {
  const res = await listBuildComponentsAdmin();
  if (res.error) throw { status: 500, code: 'build_components_list_failed', message: res.error.message };
  return res.data || [];
}

export async function createAdminBuild(payload) {
  const prepared = await prepareBuildPayload(payload);

  const existing = await findBuildPresetById(prepared.preset.id);
  if (existing.error) throw { status: 500, code: 'build_lookup_failed', message: existing.error.message };
  if (existing.data) throw { status: 409, code: 'build_exists', message: 'Build ID already exists. Choose a different name.' };

  const created = await createBuildPreset(prepared.preset);
  if (created.error) throw { status: 500, code: 'build_create_failed', message: created.error.message };

  const replacedItems = await replaceBuildPresetItems(prepared.preset.id, prepared.items);
  if (replacedItems.error) {
    await deleteBuildPreset(prepared.preset.id);
    throw { status: 500, code: 'build_items_create_failed', message: replacedItems.error.message };
  }

  const hydrated = await findBuildPresetById(prepared.preset.id);
  if (hydrated.error) throw { status: 500, code: 'build_hydrate_failed', message: hydrated.error.message };
  return hydrated.data;
}

export async function updateAdminBuild(presetId, payload) {
  const existing = await findBuildPresetById(presetId);
  if (existing.error) throw { status: 500, code: 'build_lookup_failed', message: existing.error.message };
  if (!existing.data) throw { status: 404, code: 'build_not_found', message: 'Build preset not found' };

  const prepared = await prepareBuildPayload(payload, presetId);
  const { id, ...presetUpdate } = prepared.preset;
  void id;

  const updated = await updateBuildPreset(presetId, presetUpdate);
  if (updated.error) throw { status: 500, code: 'build_update_failed', message: updated.error.message };

  const replacedItems = await replaceBuildPresetItems(presetId, prepared.items);
  if (replacedItems.error) throw { status: 500, code: 'build_items_update_failed', message: replacedItems.error.message };

  const hydrated = await findBuildPresetById(presetId);
  if (hydrated.error) throw { status: 500, code: 'build_hydrate_failed', message: hydrated.error.message };
  return hydrated.data;
}

export async function deleteAdminBuild(presetId) {
  const deleted = await deleteBuildPreset(presetId);
  if (deleted.error) throw { status: 500, code: 'build_delete_failed', message: deleted.error.message };
  return { deleted: true, id: presetId };
}

export async function getAdminProducts() {
  const result = await listProductsAdmin();
  if (result.error) throw { status: 500, code: 'admin_products_failed', message: result.error.message };
  return result.data || [];
}

export async function getAdminProductDetail(productId) {
  const productRes = await findProductById(productId);
  if (productRes.error) throw { status: 500, code: 'product_lookup_failed', message: productRes.error.message };
  if (!productRes.data) throw { status: 404, code: 'product_not_found', message: 'Product not found' };

  const [specsRes, mediaRes] = await Promise.all([
    listProductSpecs(productId),
    listProductMedia(productId)
  ]);

  if (specsRes.error) throw { status: 500, code: 'product_specs_lookup_failed', message: specsRes.error.message };
  if (mediaRes.error) throw { status: 500, code: 'product_media_lookup_failed', message: mediaRes.error.message };

  return {
    ...productRes.data,
    specs: specsRes.data || [],
    media: mediaRes.data || []
  };
}

export async function createAdminProduct(payload, adminId) {
  const keysRes = await findSpecDefinitionKeys();
  if (keysRes.error) throw { status: 500, code: 'spec_keys_failed', message: keysRes.error.message };
  const allowed = new Set((keysRes.data || []).map((k) => k.spec_key));

  assertSpecKeysAllowed(payload.specs || [], allowed);

  const productRes = await createProduct({
    sku: payload.sku,
    slug: payload.slug,
    title: payload.title,
    product_type: payload.product_type,
    brand: payload.brand,
    model_name: payload.model_name,
    condition: payload.condition,
    stock_status: payload.stock_status,
    estimated_price_tzs: payload.estimated_price_tzs,
    short_description: payload.short_description || null,
    long_description: payload.long_description || null,
    warranty_text: payload.warranty_text || null,
    is_visible: payload.is_visible,
    is_featured: payload.is_featured,
    featured_tag: payload.featured_tag || null,
    created_by_admin_id: adminId
  });

  if (productRes.error) throw { status: 500, code: 'product_create_failed', message: productRes.error.message };

  const specsRes = await replaceProductSpecs(productRes.data.id, payload.specs || []);
  if (specsRes.error) throw { status: 500, code: 'product_specs_create_failed', message: specsRes.error.message };

  return productRes.data;
}

export async function updateAdminProduct(productId, payload) {
  const keysRes = await findSpecDefinitionKeys();
  if (keysRes.error) throw { status: 500, code: 'spec_keys_failed', message: keysRes.error.message };
  const allowed = new Set((keysRes.data || []).map((k) => k.spec_key));

  assertSpecKeysAllowed(payload.specs || [], allowed);

  const productRes = await updateProduct(productId, {
    sku: payload.sku,
    slug: payload.slug,
    title: payload.title,
    product_type: payload.product_type,
    brand: payload.brand,
    model_name: payload.model_name,
    condition: payload.condition,
    stock_status: payload.stock_status,
    estimated_price_tzs: payload.estimated_price_tzs,
    short_description: payload.short_description || null,
    long_description: payload.long_description || null,
    warranty_text: payload.warranty_text || null,
    is_visible: payload.is_visible,
    is_featured: payload.is_featured,
    featured_tag: payload.featured_tag || null,
    updated_at: new Date().toISOString()
  });

  if (productRes.error) throw { status: 500, code: 'product_update_failed', message: productRes.error.message };

  const specsRes = await replaceProductSpecs(productId, payload.specs || []);
  if (specsRes.error) throw { status: 500, code: 'product_specs_update_failed', message: specsRes.error.message };

  return productRes.data;
}

export async function duplicateAdminProduct(productId, adminId) {
  const productRes = await findProductById(productId);
  if (productRes.error || !productRes.data) throw { status: 404, code: 'product_not_found', message: 'Product not found' };

  const specsRes = await listProductSpecs(productId);
  if (specsRes.error) throw { status: 500, code: 'product_specs_lookup_failed', message: specsRes.error.message };

  const original = productRes.data;
  const copyPayload = {
    ...original,
    id: undefined,
    sku: `${original.sku}-COPY`,
    slug: `${original.slug}-copy-${Date.now()}`,
    created_by_admin_id: adminId
  };

  const created = await createProduct(copyPayload);
  if (created.error) throw { status: 500, code: 'product_duplicate_failed', message: created.error.message };

  const clonedSpecs = (specsRes.data || []).map((s) => ({
    spec_key: s.spec_key,
    value_text: s.value_text,
    value_number: s.value_number,
    value_bool: s.value_bool,
    value_json: s.value_json,
    unit: s.unit,
    sort_order: s.sort_order
  }));

  const insertSpecs = await replaceProductSpecs(created.data.id, clonedSpecs);
  if (insertSpecs.error) throw { status: 500, code: 'product_duplicate_specs_failed', message: insertSpecs.error.message };

  return created.data;
}

export async function quickEditAdminProduct(productId, payload) {
  const updated = await updateProduct(productId, {
    ...payload,
    updated_at: new Date().toISOString()
  });
  if (updated.error) throw { status: 500, code: 'product_quick_edit_failed', message: updated.error.message };
  return updated.data;
}

export async function listAdminQuotes() {
  const res = await listQuotesAdmin();
  if (res.error) throw { status: 500, code: 'quotes_list_failed', message: res.error.message };
  return res.data || [];
}

export async function setAdminQuoteStatus(quoteId, payload) {
  const updated = await updateQuoteStatus(quoteId, payload);
  if (updated.error) throw { status: 500, code: 'quote_status_update_failed', message: updated.error.message };
  return updated.data;
}
