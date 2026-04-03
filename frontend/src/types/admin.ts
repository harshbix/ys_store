import type { Product, QuoteRecord } from './api';

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

export type AdminQuote = QuoteRecord;
