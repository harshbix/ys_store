import type { ComponentType, ProductCondition, ProductType, QuoteType, StockStatus } from './api';

export interface ProductFilters {
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
  page: number;
  limit: number;
  sort: 'price_asc' | 'price_desc' | 'newest';
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info';
}

export interface WishlistRef {
  id: string;
  slug: string;
  title: string;
}

export interface BuildSlotDefinition {
  key: ComponentType;
  label: string;
  helper: string;
}

export interface QuoteFormInput {
  customer_name: string;
  notes?: string;
  quote_type?: QuoteType;
}
