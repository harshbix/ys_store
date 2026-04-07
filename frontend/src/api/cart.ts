import { supabase } from '../lib/supabase';
import type { CartItemType, CartPayload } from '../types/api';

export interface AddCartItemBody {
  item_type: CartItemType;
  product_id?: string;
  custom_build_id?: string;
  quantity?: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

// Get session context for current user/guest
export async function getSessionContext(): Promise<{ customerAuthId: string | null; sessionToken: string | null }> {
  const guestToken = typeof window !== 'undefined'
    ? localStorage.getItem('ys-guest-session') || crypto.randomUUID()
    : null;

  if (guestToken && typeof window !== 'undefined') {
    localStorage.setItem('ys-guest-session', guestToken);
  }

  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    return {
      customerAuthId: session.user.id,
      // Keep a stable guest token even for signed-in users so backend quote/cart ownership checks can correlate requests.
      sessionToken: guestToken
    };
  }

  return {
    customerAuthId: null,
    sessionToken: guestToken
  };
}

// Get or create cart using RPC
async function getOrCreateCart(): Promise<string> {
  const { customerAuthId, sessionToken } = await getSessionContext();

  const { data, error } = await supabase.rpc('get_or_create_customer_cart', {
    p_customer_auth_id: customerAuthId,
    p_session_token: sessionToken
  });

  if (error) {
    console.error('[CART ERROR] Failed to get/create cart:', error);
    throw new Error(`Cart operation failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Cart creation failed: no cart returned');
  }

  return data[0].id;
}

export async function getCart(): Promise<CartPayload> {
  try {
    const cartId = await getOrCreateCart();

    const { data, error } = await supabase.rpc('get_cart_with_items', {
      p_cart_id: cartId
    });

    if (error) {
      console.error('[CART ERROR] Failed to fetch cart:', error);
      throw new Error(`Cart fetch failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      // Fallback: return empty cart
      return {
        cart: { id: cartId, status: 'active' },
        items: [],
        estimated_total_tzs: 0
      };
    }

    const cart = data[0];
    const items = Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items || '[]');

    return {
      cart: {
        id: cart.cart_id,
        status: cart.status
      },
      items,
      estimated_total_tzs: cart.estimated_total_tzs || 0
    };
  } catch (err) {
    console.error('[CART CRITICAL] getCart failed:', err);
    throw err;
  }
}

export async function addCartItem(body: AddCartItemBody): Promise<CartPayload> {
  try {
    const cartId = await getOrCreateCart();

    const { data, error } = await supabase.rpc('add_item_to_cart', {
      p_cart_id: cartId,
      p_item_type: body.item_type,
      p_product_id: body.item_type === 'product' ? body.product_id : null,
      p_custom_build_id: body.item_type === 'custom_build' ? body.custom_build_id : null,
      p_quantity: body.quantity || 1
    });

    if (error) {
      console.error('[CART ERROR] Failed to add item:', error);
      throw new Error(`Add item failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Add item failed: no response');
    }

    const cart = data[0];
    const items = Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items || '[]');

    return {
      cart: {
        id: cart.cart_id,
        status: cart.status
      },
      items,
      estimated_total_tzs: cart.estimated_total_tzs || 0
    };
  } catch (err) {
    console.error('[CART CRITICAL] addCartItem failed:', err);
    throw err;
  }
}

export async function updateCartItem(itemId: string, body: UpdateCartItemBody): Promise<CartPayload> {
  try {
    const cartId = await getOrCreateCart();

    const { data, error } = await supabase.rpc('update_cart_item_quantity', {
      p_cart_id: cartId,
      p_item_id: itemId,
      p_quantity: body.quantity
    });

    if (error) {
      console.error('[CART ERROR] Failed to update item:', error);
      throw new Error(`Update item failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Update item failed: no response');
    }

    const cart = data[0];
    const items = Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items || '[]');

    return {
      cart: {
        id: cart.cart_id,
        status: cart.status
      },
      items,
      estimated_total_tzs: cart.estimated_total_tzs || 0
    };
  } catch (err) {
    console.error('[CART CRITICAL] updateCartItem failed:', err);
    throw err;
  }
}

export async function removeCartItem(itemId: string): Promise<CartPayload> {
  try {
    const cartId = await getOrCreateCart();

    const { data, error } = await supabase.rpc('remove_item_from_cart', {
      p_cart_id: cartId,
      p_item_id: itemId
    });

    if (error) {
      console.error('[CART ERROR] Failed to remove item:', error);
      throw new Error(`Remove item failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Remove item failed: no response');
    }

    const cart = data[0];
    const items = Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items || '[]');

    return {
      cart: {
        id: cart.cart_id,
        status: cart.status
      },
      items,
      estimated_total_tzs: cart.estimated_total_tzs || 0
    };
  } catch (err) {
    console.error('[CART CRITICAL] removeCartItem failed:', err);
    throw err;
  }
}
