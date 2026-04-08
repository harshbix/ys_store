import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { verifyPassword } from '../../utils/password.js';
import {
  findAdminByEmail,
  listProductsAdmin,
  findSpecDefinitionKeys,
  createProduct,
  updateProduct,
  findProductById,
  listProductSpecs,
  listProductMedia,
  replaceProductSpecs,
  listQuotesAdmin,
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
