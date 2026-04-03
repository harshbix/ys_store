import type { Product, ProductMedia, ProductSpec, QuoteRecord } from './api';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'owner';
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminLoginPayload {
  token: string;
  admin: AdminUser;
}

export interface AdminSessionState {
  token: string | null;
  admin: AdminUser | null;
}

export type AdminProduct = Product;

export interface AdminProductSpecInput {
  spec_key: string;
  value_text?: string;
  value_number?: number;
  value_bool?: boolean;
  value_json?: Record<string, unknown>;
  unit?: string;
  sort_order?: number;
}

export interface AdminProductPayload {
  sku: string;
  slug: string;
  title: string;
  product_type: Product['product_type'];
  brand: string;
  model_name: string;
  condition: Product['condition'];
  stock_status: Product['stock_status'];
  estimated_price_tzs: number;
  short_description?: string;
  long_description?: string;
  warranty_text?: string | null;
  is_visible: boolean;
  is_featured: boolean;
  featured_tag?: 'best_seller' | 'hot_deal' | 'recommended' | null;
  specs: AdminProductSpecInput[];
}

export interface AdminProductDetail extends AdminProduct {
  specs: ProductSpec[];
  media: ProductMedia[];
}

export interface AdminSignedUploadPayload {
  owner_type: 'product' | 'shop';
  owner_id?: string;
  file_name: string;
  content_type: string;
  variant: 'original' | 'thumb' | 'full';
}

export interface AdminSignedUploadResponse {
  path: string;
  token: string;
  signed_url: string;
}

export interface AdminFinalizeUploadPayload {
  owner_type: 'product' | 'shop';
  owner_id?: string;
  original_path: string;
  thumb_path: string;
  full_path: string;
  width?: number;
  height?: number;
  size_bytes?: number;
  alt_text?: string;
  caption?: string;
  is_primary?: boolean;
  is_visible?: boolean;
  sort_order?: number;
}

export type AdminQuote = QuoteRecord;
