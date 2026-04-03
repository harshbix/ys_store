import { apiClient } from './client';
import { addCartItem, getCart } from './cart';
import { getFixtureBuildCandidates } from '../fixtures/builds';
import type {
  ApiEnvelope,
  BuildAddToCartPayload,
  BuildPayload,
  BuildValidationPayload,
  ComponentType,
  CustomBuild,
  Product
} from '../types/api';
import { env } from '../utils/env';
import { logError } from '../utils/errors';

export interface CreateBuildBody {
  name?: string;
}

export interface UpsertBuildItemBody {
  component_type: ComponentType;
  product_id: string;
}

export interface ValidateBuildBody {
  auto_replace?: boolean;
}

const fixtureBuildStorageKey = 'ys-dev-fixture-builds';

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `fix-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadFixtureBuilds(): BuildPayload[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(fixtureBuildStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BuildPayload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFixtureBuilds(builds: BuildPayload[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(fixtureBuildStorageKey, JSON.stringify(builds));
}

function recalcBuildTotals(build: BuildPayload): BuildPayload {
  const total = build.items.reduce((sum, item) => sum + Number(item.unit_estimated_price_tzs) * Number(item.quantity), 0);
  return {
    ...build,
    total_estimated_price_tzs: total,
    updated_at: nowIso()
  };
}

function findFixtureProduct(productId: string, componentType: ComponentType): Product {
  const candidates = getFixtureBuildCandidates(componentType);
  return candidates.find((product) => product.id === productId) || candidates[0];
}

function fixtureCreateBuild(name?: string): ApiEnvelope<CustomBuild> {
  const builds = loadFixtureBuilds();
  const timestamp = Date.now();

  const build: BuildPayload = {
    id: randomId(),
    build_code: `FIX-BLD-${String(timestamp).slice(-6)}`,
    owner_type: 'guest',
    customer_auth_id: null,
    session_token: null,
    name: name || 'My Custom Build',
    build_status: 'draft',
    compatibility_status: 'warning',
    replacement_summary: null,
    total_estimated_price_tzs: 0,
    is_saved: false,
    created_at: nowIso(),
    updated_at: nowIso(),
    items: []
  };

  builds.unshift(build);
  saveFixtureBuilds(builds);

  return {
    success: true,
    message: 'Created (dev fixture fallback)',
    data: {
      id: build.id,
      build_code: build.build_code,
      owner_type: build.owner_type,
      customer_auth_id: build.customer_auth_id,
      session_token: build.session_token,
      name: build.name,
      build_status: build.build_status,
      compatibility_status: build.compatibility_status,
      replacement_summary: build.replacement_summary,
      total_estimated_price_tzs: build.total_estimated_price_tzs,
      is_saved: build.is_saved,
      created_at: build.created_at,
      updated_at: build.updated_at
    }
  };
}

function fixtureGetBuild(buildId: string): ApiEnvelope<BuildPayload> | null {
  const build = loadFixtureBuilds().find((entry) => entry.id === buildId);
  if (!build) return null;

  return {
    success: true,
    message: 'OK (dev fixture fallback)',
    data: build
  };
}

function fixtureUpsertBuildItem(buildId: string, body: UpsertBuildItemBody): ApiEnvelope<BuildPayload> | null {
  const builds = loadFixtureBuilds();
  const index = builds.findIndex((entry) => entry.id === buildId);
  if (index < 0) return null;

  const product = findFixtureProduct(body.product_id, body.component_type);
  const existingItem = builds[index].items.find((item) => item.component_type === body.component_type);

  const nextItems = existingItem
    ? builds[index].items.map((item) =>
        item.component_type === body.component_type
          ? {
              ...item,
              product_id: product.id,
              quantity: 1,
              unit_estimated_price_tzs: product.estimated_price_tzs,
              products: product
            }
          : item
      )
    : [
        ...builds[index].items,
        {
          id: randomId(),
          custom_build_id: buildId,
          component_type: body.component_type,
          product_id: product.id,
          quantity: 1,
          unit_estimated_price_tzs: product.estimated_price_tzs,
          is_auto_replaced: false,
          compatibility_notes: null,
          created_at: nowIso(),
          products: product
        }
      ];

  const updated = recalcBuildTotals({
    ...builds[index],
    items: nextItems
  });

  builds[index] = updated;
  saveFixtureBuilds(builds);

  return {
    success: true,
    message: 'Updated (dev fixture fallback)',
    data: updated
  };
}

function fixtureDeleteBuildItem(buildId: string, itemId: string): ApiEnvelope<BuildPayload> | null {
  const builds = loadFixtureBuilds();
  const index = builds.findIndex((entry) => entry.id === buildId);
  if (index < 0) return null;

  const updated = recalcBuildTotals({
    ...builds[index],
    items: builds[index].items.filter((item) => item.id !== itemId)
  });

  builds[index] = updated;
  saveFixtureBuilds(builds);

  return {
    success: true,
    message: 'Updated (dev fixture fallback)',
    data: updated
  };
}

function fixtureValidateBuild(buildId: string): ApiEnvelope<BuildValidationPayload> | null {
  const builds = loadFixtureBuilds();
  const index = builds.findIndex((entry) => entry.id === buildId);
  if (index < 0) return null;

  const build = builds[index];
  const required: ComponentType[] = ['cpu', 'motherboard', 'ram', 'storage', 'psu'];
  const selected = new Set(build.items.map((item) => item.component_type));
  const warnings = required.filter((component) => !selected.has(component)).map((component) => `Missing ${component.toUpperCase()} in build.`);

  const compatibility_status: BuildPayload['compatibility_status'] = warnings.length > 0 ? 'warning' : 'valid';
  const build_status: BuildPayload['build_status'] = warnings.length > 0 ? 'draft' : 'valid';

  const updated = {
    ...build,
    compatibility_status,
    build_status,
    updated_at: nowIso()
  };

  builds[index] = updated;
  saveFixtureBuilds(builds);

  return {
    success: true,
    message: 'Validated (dev fixture fallback)',
    data: {
      compatibility_status,
      errors: [],
      warnings,
      replacements: [],
      normalized_items: updated.items,
      total_estimated_tzs: updated.total_estimated_price_tzs,
      rules_count: required.length
    }
  };
}

async function fixtureAddBuildToCart(buildId: string): Promise<ApiEnvelope<BuildAddToCartPayload> | null> {
  const build = loadFixtureBuilds().find((entry) => entry.id === buildId);
  if (!build) return null;

  await addCartItem({ item_type: 'custom_build', custom_build_id: buildId, quantity: 1 });
  const cart = await getCart();

  return {
    success: true,
    message: 'Added to cart (dev fixture fallback)',
    data: {
      build_id: buildId,
      cart: cart.data
    }
  };
}

export async function createBuild(body: CreateBuildBody = {}): Promise<ApiEnvelope<CustomBuild>> {
  try {
    const { data } = await apiClient.post<ApiEnvelope<CustomBuild>>('/builds', body);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'builds.createBuild.fallback');
    return fixtureCreateBuild(body.name);
  }
}

export async function getBuild(buildId: string): Promise<ApiEnvelope<BuildPayload>> {
  try {
    const { data } = await apiClient.get<ApiEnvelope<BuildPayload>>(`/builds/${buildId}`);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'builds.getBuild.fallback');
    const fixture = fixtureGetBuild(buildId);
    if (!fixture) throw error;
    return fixture;
  }
}

export async function upsertBuildItem(buildId: string, body: UpsertBuildItemBody): Promise<ApiEnvelope<BuildPayload>> {
  try {
    const { data } = await apiClient.patch<ApiEnvelope<BuildPayload>>(`/builds/${buildId}/items`, body);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'builds.upsertBuildItem.fallback');
    const fixture = fixtureUpsertBuildItem(buildId, body);
    if (!fixture) throw error;
    return fixture;
  }
}

export async function deleteBuildItem(buildId: string, itemId: string): Promise<ApiEnvelope<BuildPayload>> {
  try {
    const { data } = await apiClient.delete<ApiEnvelope<BuildPayload>>(`/builds/${buildId}/items/${itemId}`);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'builds.deleteBuildItem.fallback');
    const fixture = fixtureDeleteBuildItem(buildId, itemId);
    if (!fixture) throw error;
    return fixture;
  }
}

export async function validateBuild(buildId: string, body: ValidateBuildBody): Promise<ApiEnvelope<BuildValidationPayload>> {
  try {
    const { data } = await apiClient.post<ApiEnvelope<BuildValidationPayload>>(`/builds/${buildId}/validate`, body);
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'builds.validateBuild.fallback');
    const fixture = fixtureValidateBuild(buildId);
    if (!fixture) throw error;
    return fixture;
  }
}

export async function addBuildToCart(buildId: string): Promise<ApiEnvelope<BuildAddToCartPayload>> {
  try {
    const { data } = await apiClient.post<ApiEnvelope<BuildAddToCartPayload>>(`/builds/${buildId}/add-to-cart`, {});
    return data;
  } catch (error) {
    if (!env.enableDevFixtures) {
      throw error;
    }

    logError(error, 'builds.addBuildToCart.fallback');
    const fixture = await fixtureAddBuildToCart(buildId);
    if (!fixture) throw error;
    return fixture;
  }
}
