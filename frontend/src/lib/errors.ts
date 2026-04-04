import type { ApiErrorEnvelope } from '../types/api';
import { ApiClientError } from './apiClient';

export interface NormalizedError {
  status: number;
  code: string;
  message: string;
  requestId?: string | null;
}

function isNormalizedError(error: unknown): error is NormalizedError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<NormalizedError>;
  return (
    typeof candidate.status === 'number'
    && typeof candidate.code === 'string'
    && typeof candidate.message === 'string'
  );
}

function isApiEnvelopeError(error: unknown): error is ApiErrorEnvelope {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<ApiErrorEnvelope>;
  return candidate.success === false && typeof candidate.message === 'string';
}

export function normalizeApiError(error: unknown): NormalizedError {
  if (isNormalizedError(error)) {
    return error;
  }

  if (error instanceof ApiClientError) {
    return {
      status: error.status,
      code: error.code || 'api_error',
      message: error.message || 'Request failed',
      requestId: error.requestId
    };
  }

  if (isApiEnvelopeError(error)) {
    return {
      status: 500,
      code: error.error_code || 'api_error',
      message: error.message || 'Request failed',
      requestId: error.details?.request_id
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      code: 'unknown_error',
      message: error.message
    };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const candidate = error as { message?: unknown; status?: unknown; code?: unknown; requestId?: unknown };
    return {
      status: typeof candidate.status === 'number' ? candidate.status : 500,
      code: typeof candidate.code === 'string' ? candidate.code : 'unknown_error',
      message: typeof candidate.message === 'string' ? candidate.message : 'Unexpected error occurred',
      requestId: typeof candidate.requestId === 'string' ? candidate.requestId : null
    };
  }

  return {
    status: 500,
    code: 'unknown_error',
    message: 'Unexpected error occurred'
  };
}

export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  return normalizeApiError(error).message || fallback;
}

export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const normalized = normalizeApiError(error);

  if (normalized.code === 'timeout') {
    return 'Request timed out. Please retry.';
  }

  if (normalized.code === 'network_error' || normalized.status === 0) {
    return 'Network issue detected. Check your connection and try again.';
  }

  if (normalized.status >= 500) {
    return 'Server is temporarily unavailable. Please try again shortly.';
  }

  if (normalized.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  return normalized.message || fallback;
}
