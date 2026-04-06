import { supabase } from '../lib/supabase';
import type {
  ProductCondition,
  Product,
  ProductDetail,
  ProductListPayload,
  ProductMedia,
  ProductSpec,
  ProductType,
  StockStatus
} from '../types/api';

export interface GetProductsParams {
  type?: ProductType;
  brand?: string;
  condition?: ProductCondition;
  min_price?: number;
  max_price?: number;
  cpu?: string;
  gpu?: string;
  ram_gb?: number;
  storage_gb?: number;
  screen_size?: number;
  refresh_rate?: number;
  stock_status?: StockStatus;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}

type DbProductRow = Product & {
  product_media?: ProductMedia[] | null;
  product_specs?: ProductSpec[] | null;
};

function toPublicMediaUrl(url: string | null): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const { data } = supabase.storage.from('product-media').getPublicUrl(url);
  return data?.publicUrl || url;
}

function normalizeMedia(mediaRows?: ProductMedia[] | null): ProductMedia[] {
  if (!Array.isArray(mediaRows)) return [];

  return mediaRows.map((media) => ({
    ...media,
    original_url: toPublicMediaUrl(media.original_url),
    thumb_url: toPublicMediaUrl(media.thumb_url),
    full_url: toPublicMediaUrl(media.full_url)
  }));
}

function normalizeProduct(row: DbProductRow): Product {
  return {
    ...row,
    media: normalizeMedia(row.product_media)
  };
}

function normalizeProductDetail(row: DbProductRow): ProductDetail {
  return {
    ...normalizeProduct(row),
    specs: Array.isArray(row.product_specs) ? row.product_specs : [],
    media: normalizeMedia(row.product_media)
  };
}

export async function getProducts(params?: GetProductsParams): Promise<ProductListPayload> {
  let query = supabase
    .from('products')
    .select('*, product_media(*), product_specs(*)', { count: 'exact' })
    .eq('is_visible', true);

  if (params?.type) query = query.eq('product_type', params.type);
  if (params?.brand) query = query.eq('brand', params.brand);
  if (params?.condition) query = query.eq('condition', params.condition);
  if (params?.stock_status) query = query.eq('stock_status', params.stock_status);
  if (params?.min_price) query = query.gte('estimated_price_tzs', params.min_price);
  if (params?.max_price) query = query.lte('estimated_price_tzs', params.max_price);

  // Sorting
  if (params?.sort === 'price_asc') {
    query = query.order('estimated_price_tzs', { ascending: true });
  } else if (params?.sort === 'price_desc') {
    query = query.order('estimated_price_tzs', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const limit = Math.min(params?.limit || 20, 100);
  const page = params?.page || 1;
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  // Transform all product media URLs
  const items = (data || []).map((row) => normalizeProduct(row as DbProductRow));

  return {
    items,
    total: count || 0
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_media(*), product_specs(*)')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Product not found');

  return normalizeProductDetail(data as DbProductRow);
}

export async function getFeaturedProducts(type?: ProductType, limit = 8): Promise<ProductListPayload> {
  return getProducts({ type, sort: 'newest', limit, page: 1 });
}
