import { apiClient } from './client';
import type {
  ApiEnvelope,
  BuildAddToCartPayload,
  BuildPayload,
  BuildValidationPayload,
  ComponentType,
  CustomBuild
} from '../types/api';

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

export async function createBuild(body: CreateBuildBody = {}): Promise<ApiEnvelope<CustomBuild>> {
  const { data } = await apiClient.post<ApiEnvelope<CustomBuild>>('/builds', body);
  return data;
}

export async function getBuild(buildId: string): Promise<ApiEnvelope<BuildPayload>> {
  const { data } = await apiClient.get<ApiEnvelope<BuildPayload>>(`/builds/${buildId}`);
  return data;
}

export async function upsertBuildItem(buildId: string, body: UpsertBuildItemBody): Promise<ApiEnvelope<BuildPayload>> {
  const { data } = await apiClient.patch<ApiEnvelope<BuildPayload>>(`/builds/${buildId}/items`, body);
  return data;
}

export async function deleteBuildItem(buildId: string, itemId: string): Promise<ApiEnvelope<BuildPayload>> {
  const { data } = await apiClient.delete<ApiEnvelope<BuildPayload>>(`/builds/${buildId}/items/${itemId}`);
  return data;
}

export async function validateBuild(buildId: string, body: ValidateBuildBody): Promise<ApiEnvelope<BuildValidationPayload>> {
  const { data } = await apiClient.post<ApiEnvelope<BuildValidationPayload>>(`/builds/${buildId}/validate`, body);
  return data;
}

export async function addBuildToCart(buildId: string): Promise<ApiEnvelope<BuildAddToCartPayload>> {
  const { data } = await apiClient.post<ApiEnvelope<BuildAddToCartPayload>>(`/builds/${buildId}/add-to-cart`, {});
  return data;
}
