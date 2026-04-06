import { supabase } from '../lib/supabase';
import type {
  OtpRequestPayload,
  OtpVerifyPayload,
  PasswordAuthPayload,
  WishlistPayload
} from '../types/api';

interface PersistentCartPayload {
  customer_auth_id: string;
  cart: {
    id: string;
    status: string;
  };
  items: Array<{
    id: string;
    item_type: 'product' | 'custom_build';
    product_id: string | null;
    custom_build_id: string | null;
    quantity: number;
    unit_estimated_price_tzs: number;
  }>;
  estimated_total_tzs: number;
}

export async function requestOtp(email: string): Promise<OtpRequestPayload> {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    throw error;
  }
  return { challenge_id: `OTP-${Date.now()}` };
}

export async function registerWithPassword(
  full_name: string,
  email: string,
  password: string
): Promise<PasswordAuthPayload> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name
      }
    }
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Account created but user data missing');
  }

  const session = data.session || (await supabase.auth.getSession()).data.session;
  if (!session) {
    throw new Error('Account created but session could not start');
  }

  return {
    access_token: session.access_token,
    customer_id: data.user.id,
    challenge_id: null
  };
}

export async function loginWithPassword(email: string, password: string): Promise<PasswordAuthPayload> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed: invalid response');
  }

  return {
    access_token: data.session.access_token,
    customer_id: data.user.id,
    challenge_id: null
  };
}

export async function verifyOtp(
  email: string,
  challenge_id: string,
  code: string
): Promise<PasswordAuthPayload> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email'
  });

  if (error) {
    throw error;
  }

  if (!data.user || !data.session) {
    throw new Error('OTP verification failed');
  }

  return {
    access_token: data.session.access_token,
    customer_id: data.user.id,
    challenge_id
  };
}

export async function getRemoteWishlist(token: string): Promise<WishlistPayload> {
  const { data, error } = await supabase
    .from('wishlists')
    .select('*, wishlist_items(*, products(*))')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      wishlist_id: '',
      items: []
    };
  }

  return {
    wishlist_id: data.id,
    items: data.wishlist_items || []
  };
}

export async function addRemoteWishlistItem(product_id: string, token: string): Promise<WishlistPayload> {
  // First get the wishlist
  const { data: wishlist, error: wlError } = await supabase
    .from('wishlists')
    .select('id')
    .single();

  if (wlError) throw wlError;

  // Add item
  const { error: addError } = await supabase
    .from('wishlist_items')
    .insert({ wishlist_id: wishlist.id, product_id });

  if (addError) throw addError;

  // Return updated wishlist
  return getRemoteWishlist(token);
}

export async function removeRemoteWishlistItem(productId: string, token: string): Promise<WishlistPayload> {
  // First get the wishlist
  const { data: wishlist, error: wlError } = await supabase
    .from('wishlists')
    .select('id')
    .single();

  if (wlError) throw wlError;

  // Remove item
  const { error: delError } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('wishlist_id', wishlist.id)
    .eq('product_id', productId);

  if (delError) throw delError;

  // Return updated wishlist
  return getRemoteWishlist(token);
}

export async function getPersistentCustomerCart(token: string): Promise<PersistentCartPayload> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: carts, error } = await supabase
    .from('carts')
    .select('*, cart_items(*)')
    .eq('customer_auth_id', user.user.id)
    .eq('status', 'active')
    .single();

  if (error) throw error;

  const estimated_total_tzs = (carts.cart_items || []).reduce(
    (sum, item) => sum + item.unit_estimated_price_tzs * item.quantity,
    0
  );

  return {
    customer_auth_id: user.user.id,
    cart: {
      id: carts.id,
      status: carts.status
    },
    items: carts.cart_items || [],
    estimated_total_tzs
  };
}

export async function syncPersistentCustomerCart(
  token: string,
  payload: {
    source_cart_id?: string;
    items?: Array<{
      item_type: 'product' | 'custom_build';
      product_id?: string;
      custom_build_id?: string;
      quantity: number;
    }>;
  }
): Promise<PersistentCartPayload> {
  // This would require backend RPC logic for proper transaction handling
  // For now, throw an error indicating this needs backend support
  throw new Error(
    'Persistent cart sync requires transactional backend logic. Use backend RPC or Edge Function.'
  );
}
