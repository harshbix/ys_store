import { supabase } from '../../lib/supabase.js';

export async function findAdminByEmail(email) {
  return supabase.from('admin_users').select('*').eq('email', email).eq('is_active', true).maybeSingle();
}

export async function listProductsAdmin() {
  return supabase.from('products').select('*').order('updated_at', { ascending: false });
}

export async function findSpecDefinitionKeys() {
  return supabase.from('spec_definitions').select('spec_key');
}

export async function createProduct(payload) {
  return supabase.from('products').insert(payload).select().single();
}

export async function updateProduct(productId, payload) {
  return supabase.from('products').update(payload).eq('id', productId).select().single();
}

export async function findProductById(productId) {
  return supabase.from('products').select('*').eq('id', productId).maybeSingle();
}

export async function listProductSpecs(productId) {
  return supabase.from('product_specs').select('*').eq('product_id', productId);
}

export async function listProductMedia(productId) {
  return supabase.from('product_media').select('*').eq('product_id', productId).order('sort_order', { ascending: true });
}

export async function replaceProductSpecs(productId, specs) {
  const del = await supabase.from('product_specs').delete().eq('product_id', productId);
  if (del.error) return del;
  if (!specs.length) return { data: [], error: null };

  return supabase.from('product_specs').insert(specs.map((s) => ({ ...s, product_id: productId })));
}

export async function listQuotesAdmin() {
  return supabase.from('quotes').select('*').order('created_at', { ascending: false });
}

export async function updateQuoteStatus(quoteId, payload) {
  return supabase.from('quotes').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', quoteId).select().single();
}
