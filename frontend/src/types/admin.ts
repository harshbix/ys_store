import type { BuildPreset, PCComponent, Product, ProductMedia, ProductSpec, QuoteRecord } from './api';

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

export interface AdminDashboardStats {
  total_registered_users: number;
  new_users_this_week: number;
  total_products: number;
  total_builds: number;
  whatsapp_checkout_clicks: number;
  low_stock_items: number;
}

export interface AdminActivityItem {
  id: string;
  type: 'analytics' | 'quote' | 'product' | 'build' | 'user';
  title: string;
  description: string | null;
  occurred_at: string;
}

export interface AdminTopViewedProduct {
  product_id: string;
  title: string;
  slug: string | null;
  views: number;
  estimated_price_tzs: number;
}

export interface AdminTopSelectedBuild {
  build_id: string;
  build_code: string | null;
  name: string;
  selections: number;
  total_estimated_price_tzs: number;
}

export interface AdminDashboardSummaryPayload {
  stats: AdminDashboardStats;
  recent_activity: AdminActivityItem[];
  top_viewed_products: AdminTopViewedProduct[];
  top_selected_builds: AdminTopSelectedBuild[];
  generated_at: string;
}

export interface AdminRegisteredUser {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  created_at: string;
  last_active_at: string | null;
  is_email_confirmed: boolean;
  is_admin_account: boolean;
}

export interface AdminUsersSummaryPayload {
  total_registered_users: number;
  new_users_this_week: number;
  page: number;
  limit: number;
  total_matching_users: number;
  recent_users: AdminRegisteredUser[];
}

export interface AdminDeleteUserResult {
  deleted: boolean;
  id: string;
}

export interface AdminChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface AdminChangePasswordResult {
  updated: boolean;
  id: string;
}

export interface AdminSessionState {
  token: string | null;
  admin: AdminUser | null;
}

export type AdminProduct = Product;
export type AdminBuild = BuildPreset;
export type AdminBuildComponent = PCComponent;

export interface AdminBuildItemInput {
  slot_order: number;
  component_type: string;
  component_id: string;
  quantity: number;
}

export interface AdminBuildPayload {
  id?: string;
  name: string;
  cpu_family: string;
  build_number?: number | null;
  discount_percent?: number;
  status: string;
  estimated_system_wattage?: number | null;
  required_psu_wattage?: number | null;
  compatibility_status?: string;
  is_visible: boolean;
  items: AdminBuildItemInput[];
}

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
