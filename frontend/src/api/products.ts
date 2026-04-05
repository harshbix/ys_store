import { supabase } from '../lib/supabase';
import type {
  ProductCondition,
  ProductDetail,
  ProductListPayload,
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

// Convert storage media URLs to public URLs
function transformProductMedia(product: any) {
  if (!product.product_media) return product;

  return {
    ...product,
    product_media: product.product_media.map((media: any) => {
      // If media_url is a storage path, convert to public URL
      if (media.media_url && !media.media_url.startsWith('http')) {
        const { data } = supabase.storage
          .from('product-media')
          .getPublicUrl(media.media_url);
        return {
          ...media,
          media_url: data?.publicUrl || media.media_url
        };
      }
      return media;
    })
  };
}

export async function getProducts(params?: GetProductsParams): Promise<ProductListPayload> {
  let query = supabase
    .from('products')
    .select('*, product_media(*), product_specs(*)')
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
  const productsWithMedia = (data || []).map(transformProductMedia);

  return {
    products: productsWithMedia,
    total: count || 0,
    page,
    limit
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

  // Transform media URLs
  return transformProductMedia(data) as ProductDetail;
}

export async function getFeaturedProducts(type?: ProductType, limit = 8): Promise<ProductListPayload> {
  return getProducts({ type, sort: 'newest', limit, page: 1 });
}
