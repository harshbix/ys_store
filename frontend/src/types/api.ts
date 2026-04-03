export type ProductType = 'desktop' | 'laptop' | 'accessory' | 'component';
export type ProductCondition = 'new' | 'imported_used' | 'refurbished' | 'custom_build';
export type StockStatus = 'in_stock' | 'low_stock' | 'build_on_request' | 'incoming_stock' | 'sold_out';
export type CartItemType = 'product' | 'custom_build';
export type ComponentType =
  | 'cpu'
  | 'motherboard'
  | 'gpu'
  | 'ram'
  | 'storage'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'monitor'
  | 'keyboard_mouse'
  | 'windows_license';
export type BuildStatus = 'draft' | 'valid' | 'quoted' | 'archived';
export type CompatibilityStatus = 'valid' | 'warning' | 'invalid';
export type QuoteType = 'laptop' | 'desktop' | 'build' | 'upgrade' | 'warranty' | 'general';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorEnvelope {
  success: false;
  error_code: string;
  message: string;
  details?: {
    details?: unknown;
    request_id?: string | null;
  } | null;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  title: string;
  product_type: ProductType;
  brand: string;
  model_name: string;
  condition: ProductCondition;
  stock_status: StockStatus;
  estimated_price_tzs: number;
  short_description: string | null;
  long_description: string | null;
  warranty_text: string | null;
  is_visible: boolean;
  is_featured: boolean;
  featured_tag: string | null;
  created_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductSpec {
  id: number;
  product_id: string;
  spec_key: string;
  value_text: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  value_json: Record<string, unknown> | null;
  unit: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  original_url: string;
  thumb_url: string;
  full_url: string;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductDetail extends Product {
  specs: ProductSpec[];
  media: ProductMedia[];
}

export interface ProductListPayload {
  items: Product[];
  total: number;
}

export interface CartRecord {
  id: string;
  session_token: string | null;
  customer_auth_id: string | null;
  status: 'active' | 'converted_to_quote' | 'expired';
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface CartItem {
  id: string;
  cart_id: string;
  item_type: CartItemType;
  product_id: string | null;
  custom_build_id: string | null;
  quantity: number;
  unit_estimated_price_tzs: number;
  title_snapshot: string;
  specs_snapshot: Record<string, unknown> | null;
  created_at: string;
}

export interface CartPayload {
  cart: CartRecord;
  items: CartItem[];
  estimated_total_tzs: number;
}

export interface CustomBuild {
  id: string;
  build_code: string;
  owner_type: 'guest' | 'customer';
  customer_auth_id: string | null;
  session_token: string | null;
  name: string | null;
  build_status: BuildStatus;
  compatibility_status: CompatibilityStatus;
  replacement_summary: Array<Record<string, unknown>> | null;
  total_estimated_price_tzs: number;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface BuildItem {
  id: string;
  custom_build_id: string;
  component_type: ComponentType;
  product_id: string;
  quantity: number;
  unit_estimated_price_tzs: number;
  is_auto_replaced: boolean;
  compatibility_notes: Record<string, unknown> | null;
  created_at: string;
  products?: Product;
}

export interface BuildPayload extends CustomBuild {
  items: BuildItem[];
}

export interface BuildValidationPayload {
  compatibility_status: CompatibilityStatus;
  errors: string[];
  warnings: string[];
  replacements: Array<{
    component_type: ComponentType;
    from_product_id: string;
    to_product_id: string;
    reason: string;
    message: string;
  }>;
  normalized_items: BuildItem[];
  total_estimated_tzs: number;
  rules_count: number;
}

export interface BuildAddToCartPayload {
  build_id: string;
  cart: CartPayload;
}

export interface QuoteRecord {
  id: string;
  quote_code: string;
  quote_type: QuoteType;
  status: 'new' | 'whatsapp_sent' | 'negotiating' | 'confirmed' | 'closed_won' | 'closed_lost';
  customer_name: string;
  notes: string | null;
  estimated_total_tzs: number;
  source_cart_id: string | null;
  source_build_id: string | null;
  idempotency_key: string;
  replacement_summary: Array<Record<string, unknown>> | null;
  whatsapp_message: string;
  whatsapp_clicked_at: string | null;
  created_at: string;
  updated_at: string;
  closed_reason: string | null;
  whatsapp_url?: string;
  whatsapp_meta?: {
    url: string;
    encoded: string;
    phone: string;
  };
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_type: CartItemType;
  ref_product_id: string | null;
  ref_custom_build_id: string | null;
  title_snapshot: string;
  specs_snapshot: Record<string, unknown> | null;
  quantity: number;
  unit_estimated_price_tzs: number;
  line_total_tzs: number;
  created_at: string;
}

export interface QuoteDetail extends QuoteRecord {
  items: QuoteItem[];
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  created_at: string;
  products?: Product;
}

export interface WishlistPayload {
  wishlist_id: string;
  items: WishlistItem[];
}

export interface OtpRequestPayload {
  challenge_id: string;
}

export interface OtpVerifyPayload {
  access_token: string;
  customer_id: string;
  challenge_id: string;
}
