import { apiClient } from './client';
import type {
  ApiEnvelope,
  ProductCondition,
  ProductDetail,
  ProductListPayload,
  ProductType,
  StockStatus
} from '../types/api';
import { getFixtureProductDetail, getFixtureProducts } from '../fixtures/products';
import { env } from '../utils/env';
import { logError } from '../utils/errors';

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
  try {
    const { data } = await apiClient.get<ApiEnvelope<ProductListPayload>>('/products', { params });
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'products.getProducts.fallback');
    const source = getFixtureProducts();

    let items = source;
    const brand = params?.brand;
    const minPrice = params?.min_price;
    const maxPrice = params?.max_price;

    if (params?.type) items = items.filter((product) => product.product_type === params.type);
    if (params?.condition) items = items.filter((product) => product.condition === params.condition);
    if (params?.stock_status) items = items.filter((product) => product.stock_status === params.stock_status);
    if (brand) items = items.filter((product) => product.brand.toLowerCase().includes(brand.toLowerCase()));
    if (minPrice !== undefined) items = items.filter((product) => product.estimated_price_tzs >= minPrice);
    if (maxPrice !== undefined) items = items.filter((product) => product.estimated_price_tzs <= maxPrice);

    if (params?.sort === 'price_asc') {
      items = [...items].sort((a, b) => a.estimated_price_tzs - b.estimated_price_tzs);
    }
    if (params?.sort === 'price_desc') {
      items = [...items].sort((a, b) => b.estimated_price_tzs - a.estimated_price_tzs);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit;
    const paged = items.slice(from, to);

    return {
      success: true,
      message: 'OK (dev fixture fallback)',
      data: {
        items: paged,
        total: items.length
      }
    };
  }
}

export async function getProductBySlug(slug: string): Promise<ApiEnvelope<ProductDetail>> {
  try {
    const { data } = await apiClient.get<ApiEnvelope<ProductDetail>>(`/products/${slug}`);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'products.getProductBySlug.fallback');
    const fixture = getFixtureProductDetail(slug);
    if (!fixture) {
      throw error;
    }

    return {
      success: true,
      message: 'OK (dev fixture fallback)',
      data: fixture
    };
  }
}

export async function getFeaturedProducts(type?: ProductType, limit = 8): Promise<ApiEnvelope<ProductListPayload>> {
  return getProducts({ type, sort: 'newest', limit, page: 1 });
}
