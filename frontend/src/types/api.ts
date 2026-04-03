export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  stock_status: 'in_stock' | 'low_stock' | 'build_on_request' | 'incoming_stock' | 'sold_out';
  condition: 'new' | 'imported_used' | 'refurbished' | 'custom_build';
  media_urls?: string[];
  specs?: Record<string, any>;
  is_featured: boolean;
}

// Ensure the response shapes map exactly to our backend.
export interface CartItem {
  id: string;
  item_type: 'product' | 'custom_build';
  product_id?: string;
  custom_build_id?: string;
  quantity: number;
  unit_estimated_price_tzs: string;
  title_snapshot?: string;
  product?: Product;
}

export interface Cart {
  id: string;
  estimated_total_tzs: string;
  items: CartItem[];
}

export interface BuildItem {
  id?: string;
  product_id: string;
  component_type: string;
  product?: Product;
}

export interface Build {
  id: string;
  total_price: string;
  items: BuildItem[];
}

export interface Quote {
  quote_id: string;
  quote_code: string;
  total_amount: string;
  whatsapp_url: string;
  status: string;
}

export interface ValidationIssue {
  type: string;
  message: string;
}

export interface BuildValidation {
  is_valid: boolean;
  issues: ValidationIssue[];
}