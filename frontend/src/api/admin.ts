import { supabase } from '../lib/supabase';
import type {
  AdminFinalizeUploadPayload,
  AdminLoginPayload,
  AdminProduct,
  AdminProductDetail,
  AdminProductPayload,
  AdminProductSpecInput,
  AdminQuote,
  AdminSignedUploadPayload,
  AdminSignedUploadResponse,
  AdminUser
} from '../types/admin';

// Admin authentication uses Supabase Auth with role claims
export async function adminLogin(email: string, password: string): Promise<AdminLoginPayload> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  if (!data.user || !data.session) throw new Error('Admin login failed');

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (adminError) throw adminError;

  return {
    token: data.session.access_token,
    admin: admin as AdminUser
  };
}

export async function adminLogout(): Promise<{ logged_out: boolean }> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { logged_out: true };
}

export async function getAdminMe(): Promise<{ admin: AdminUser }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw userError || new Error('Not authenticated');

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (adminError) throw adminError;
  return { admin: admin as AdminUser };
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as AdminProduct[];
}

export async function getAdminProductById(productId: string): Promise<AdminProductDetail> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_media(*), product_specs(*)')
    .eq('id', productId)
    .single();

  if (error) throw error;
  return data as AdminProductDetail;
}

export async function createAdminProduct(
  payload: AdminProductPayload
): Promise<AdminProduct> {
  // Call RPC for safe product creation with spec validation
  // Media is uploaded separately via storage API
  const { data, error } = await supabase.rpc('create_product_with_specs', {
    p_sku: payload.sku,
    p_slug: payload.slug,
    p_title: payload.title,
    p_product_type: payload.product_type,
    p_brand: payload.brand,
    p_model_name: payload.model_name,
    p_condition: payload.condition,
    p_estimated_price_tzs: payload.estimated_price_tzs,
    p_short_description: payload.short_description || null,
    p_long_description: payload.long_description || null,
    p_warranty_text: payload.warranty_text || null,
    p_specs: payload.specs ? Object.fromEntries(
      payload.specs.map(s => [s.spec_key, s.value_text || s.value_number || s.value_bool || s.value_json])
    ) : null,
    p_media_paths: []
  });

  if (error) {
    console.error('[ADMIN ERROR] Product creation failed:', error);
    throw new Error(error.message || 'Failed to create product');
  }

  return data as AdminProduct;
}

export async function updateAdminProduct(
  productId: string,
  payload: AdminProductPayload
): Promise<AdminProduct> {
  // Call RPC for safe product update with spec validation
  const { data, error } = await supabase.rpc('update_product_with_specs', {
    p_product_id: productId,
    p_title: payload.title,
    p_brand: payload.brand,
    p_model_name: payload.model_name,
    p_estimated_price_tzs: payload.estimated_price_tzs,
    p_short_description: payload.short_description || null,
    p_long_description: payload.long_description || null,
    p_warranty_text: payload.warranty_text || null,
    p_specs: payload.specs ? Object.fromEntries(
      payload.specs.map(s => [s.spec_key, s.value_text || s.value_number || s.value_bool || s.value_json])
    ) : null
  });

  if (error) {
    console.error('[ADMIN ERROR] Product update failed:', error);
    throw new Error(error.message || 'Failed to update product');
  }

  // Return full product data
  return getAdminProductById(productId);
}

export async function duplicateAdminProduct(productId: string): Promise<AdminProduct> {
  // Get existing product
  const existing = await getAdminProductById(productId);

  // Create copy with new slug and SKU
  const newSlug = `${existing.slug}-copy-${Date.now()}`;
  const newSku = `${existing.sku}-COPY`;

  // Transform product specs to match AdminProductSpecInput
  const specs: AdminProductSpecInput[] = (existing.product_specs || []).map(s => ({
    spec_key: s.spec_key,
    value_text: s.value_text || undefined,
    value_number: s.value_number || undefined,
    value_bool: s.value_bool || undefined,
    value_json: s.value_json || undefined,
    unit: s.unit || undefined,
    sort_order: s.sort_order || undefined
  }));

  return createAdminProduct({
    sku: newSku,
    slug: newSlug,
    title: `${existing.title} (Copy)`,
    product_type: existing.product_type,
    brand: existing.brand,
    model_name: existing.model_name,
    condition: existing.condition,
    stock_status: existing.stock_status,
    estimated_price_tzs: existing.estimated_price_tzs,
    short_description: existing.short_description || undefined,
    long_description: existing.long_description || undefined,
    warranty_text: existing.warranty_text || null,
    is_visible: false,
    is_featured: existing.is_featured,
    featured_tag: existing.featured_tag || null,
    specs
  });
}

export async function updateProductVisibility(
  productId: string,
  isVisible: boolean
): Promise<AdminProduct> {
  const { data, error } = await supabase
    .from('products')
    .update({ is_visible: isVisible })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data as AdminProduct;
}

export async function archiveProduct(productId: string): Promise<AdminProduct> {
  return updateProductVisibility(productId, false);
}

export async function publishProduct(productId: string): Promise<AdminProduct> {
  return updateProductVisibility(productId, true);
}

export async function getAdminUploadUrl(
  payload: AdminSignedUploadPayload
): Promise<AdminSignedUploadResponse> {
  // Upload URL generation requires backend Edge Function for secure token handling
  throw new Error('Requires backend Edge Function for generating signed upload URLs');
}

export async function finalizeAdminUpload(
  payload: AdminFinalizeUploadPayload
): Promise<unknown> {
  // Finalize uploaded media in Supabase Storage
  const { path, variant, owner_type, owner_id, file_name, content_type } = payload;

  const { data, error } = await supabase
    .from('product_media')
    .insert({
      product_id: owner_type === 'product' ? owner_id : null,
      media_url: path,
      media_type: variant,
      is_visible: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminQuotes(): Promise<AdminQuote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as AdminQuote[];
}
