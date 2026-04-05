import { apiClient } from './client';
import type {
  ApiEnvelope,
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

export async function getProducts(params?: GetProductsParams): Promise<ApiEnvelope<ProductListPayload>> {
  const { data } = await apiClient.get<ApiEnvelope<ProductListPayload>>('/products', { params });
  return data;
}

export async function getProductBySlug(slug: string): Promise<ApiEnvelope<ProductDetail>> {
  const { data } = await apiClient.get<ApiEnvelope<ProductDetail>>(`/products/${slug}`);
  return data;
}

export async function getFeaturedProducts(type?: ProductType, limit = 8): Promise<ApiEnvelope<ProductListPayload>> {
  return getProducts({ type, sort: 'newest', limit, page: 1 });
}
