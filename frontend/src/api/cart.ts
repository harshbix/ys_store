import { apiClient } from './client';
import type { ApiEnvelope, CartPayload, CartItemType } from '../types/api';
import { getFixtureProducts } from '../fixtures/products';
import { env } from '../utils/env';
import { logError } from '../utils/errors';

export interface AddCartItemBody {
  item_type: CartItemType;
  product_id?: string;
  custom_build_id?: string;
  quantity?: number;
}

export interface UpdateCartItemBody {
  quantity: number;
}

const fixtureCartStorageKey = 'ys-dev-fixture-cart';

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `fix-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDefaultFixtureCart(): CartPayload {
  return {
    cart: {
      id: 'fixture-cart',
      session_token: 'fixture-session',
      customer_auth_id: null,
      status: 'active',
      created_at: nowIso(),
      updated_at: nowIso(),
      expires_at: null
    },
    items: [],
    estimated_total_tzs: 0
  };
}

function recalc(payload: CartPayload): CartPayload {
  const estimated_total_tzs = payload.items.reduce(
    (sum, item) => sum + Number(item.unit_estimated_price_tzs) * Number(item.quantity),
    0
  );

  return {
    ...payload,
    cart: {
      ...payload.cart,
      updated_at: nowIso()
    },
    estimated_total_tzs
  };
}

function loadFixtureCart(): CartPayload {
  if (typeof window === 'undefined') return getDefaultFixtureCart();

  try {
    const raw = window.localStorage.getItem(fixtureCartStorageKey);
    if (!raw) return getDefaultFixtureCart();
    const parsed = JSON.parse(raw) as CartPayload;
    if (!parsed || !parsed.cart || !Array.isArray(parsed.items)) return getDefaultFixtureCart();
    return recalc(parsed);
  } catch {
    return getDefaultFixtureCart();
  }
}

function saveFixtureCart(payload: CartPayload): CartPayload {
  const normalized = recalc(payload);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(fixtureCartStorageKey, JSON.stringify(normalized));
  }

  return normalized;
}

function fixtureEnvelope(message: string, payload: CartPayload): ApiEnvelope<CartPayload> {
  return {
    success: true,
    message,
    data: payload
  };
}

function buildTitleSnapshot(itemType: CartItemType, productId?: string): { title: string; unitPrice: number } {
  if (itemType === 'custom_build') {
    return {
      title: 'Custom Build',
      unitPrice: 0
    };
  }

  const product = getFixtureProducts().find((entry) => entry.id === productId);
  if (!product) {
    return {
      title: 'Product',
      unitPrice: 0
    };
  }

  return {
    title: product.title,
    unitPrice: product.estimated_price_tzs
  };
}

export async function getCart(): Promise<ApiEnvelope<CartPayload>> {
  try {
    const { data } = await apiClient.get<ApiEnvelope<CartPayload>>('/cart');
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'cart.getCart.fallback');
    return fixtureEnvelope('OK (dev fixture fallback)', loadFixtureCart());
  }
}

export async function addCartItem(body: AddCartItemBody): Promise<ApiEnvelope<CartPayload>> {
  try {
    const { data } = await apiClient.post<ApiEnvelope<CartPayload>>('/cart/items', body);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'cart.addCartItem.fallback');
    const payload = loadFixtureCart();

    const existing = payload.items.find((item) => {
      if (body.item_type === 'product') {
        return item.item_type === 'product' && item.product_id === body.product_id;
      }

      return item.item_type === 'custom_build' && item.custom_build_id === body.custom_build_id;
    });

    if (existing) {
      existing.quantity = Number(existing.quantity) + Number(body.quantity || 1);
    } else {
      const { title, unitPrice } = buildTitleSnapshot(body.item_type, body.product_id);
      payload.items.push({
        id: randomId(),
        cart_id: payload.cart.id,
        item_type: body.item_type,
        product_id: body.product_id || null,
        custom_build_id: body.custom_build_id || null,
        quantity: Number(body.quantity || 1),
        unit_estimated_price_tzs: unitPrice,
        title_snapshot: title,
        specs_snapshot: null,
        created_at: nowIso()
      });
    }

    return fixtureEnvelope('Updated (dev fixture fallback)', saveFixtureCart(payload));
  }
}

export async function updateCartItem(itemId: string, body: UpdateCartItemBody): Promise<ApiEnvelope<CartPayload>> {
  try {
    const { data } = await apiClient.patch<ApiEnvelope<CartPayload>>(`/cart/items/${itemId}`, body);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'cart.updateCartItem.fallback');
    const payload = loadFixtureCart();
    payload.items = payload.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            quantity: Number(body.quantity)
          }
        : item
    );

    return fixtureEnvelope('Updated (dev fixture fallback)', saveFixtureCart(payload));
  }
}

export async function removeCartItem(itemId: string): Promise<ApiEnvelope<CartPayload>> {
  try {
    const { data } = await apiClient.delete<ApiEnvelope<CartPayload>>(`/cart/items/${itemId}`);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'cart.removeCartItem.fallback');
    const payload = loadFixtureCart();
    payload.items = payload.items.filter((item) => item.id !== itemId);

    return fixtureEnvelope('Updated (dev fixture fallback)', saveFixtureCart(payload));
  }
}
