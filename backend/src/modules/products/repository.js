import { supabase } from '../../lib/supabase.js';

export async function findProducts(filters, productIds = null) {
  let query = supabase.from('products').select('*', { count: 'exact' }).eq('is_visible', true);

  if (filters.type) query = query.eq('product_type', filters.type);
  if (filters.brand) query = query.ilike('brand', `%${filters.brand}%`);
  if (filters.condition) query = query.eq('condition', filters.condition);
  if (filters.stock_status) query = query.eq('stock_status', filters.stock_status);
  if (filters.min_price !== undefined) query = query.gte('estimated_price_tzs', filters.min_price);
  if (filters.max_price !== undefined) query = query.lte('estimated_price_tzs', filters.max_price);
  if (Array.isArray(productIds)) {
    if (productIds.length === 0) {
      return { data: [], error: null, count: 0 };
    }
    query = query.in('id', productIds);
  }

  const from = (filters.page - 1) * filters.limit;
  const to = from + filters.limit - 1;

  if (filters.sort === 'price_asc') query = query.order('estimated_price_tzs', { ascending: true });
  if (filters.sort === 'price_desc') query = query.order('estimated_price_tzs', { ascending: false });
  if (filters.sort === 'newest') query = query.order('created_at', { ascending: false });

  return query.range(from, to);
}

export async function findProductBySlug(slug) {
  return supabase.from('products').select('*').eq('slug', slug).eq('is_visible', true).maybeSingle();
}

export async function findProductSpecs(productId) {
  return supabase.from('product_specs').select('*').eq('product_id', productId).order('sort_order', { ascending: true });
}

export async function findProductMedia(productId) {
  return supabase.from('product_media').select('*').eq('product_id', productId).order('sort_order', { ascending: true });
}

export async function findFilterOptions(productType) {
  let query = supabase.from('spec_definitions').select('*').eq('is_filterable', true).order('sort_order', { ascending: true });
  if (productType) {
    query = query.contains('applies_to_product_type', [productType]);
  }
  return query;
}

export async function findCompareProducts(productIds) {
  return supabase.from('products').select('*').in('id', productIds).eq('is_visible', true);
}

export async function findSpecsForProducts(productIds) {
  return supabase
    .from('product_specs')
    .select('*')
    .in('product_id', productIds)
    .order('sort_order', { ascending: true });
}

export async function findProductIdsBySpecText(specKey, value) {
  return supabase
    .from('product_specs')
    .select('product_id')
    .eq('spec_key', specKey)
    .ilike('value_text', `%${value}%`);
}

export async function findProductIdsBySpecNumberMin(specKey, minValue) {
  return supabase
    .from('product_specs')
    .select('product_id')
    .eq('spec_key', specKey)
    .gte('value_number', minValue);
}
