import { AxiosError } from 'axios';
import type { ApiErrorEnvelope } from '../types/api';

export interface NormalizedError {
  status: number;
  code: string;
  message: string;
  requestId?: string | null;
}

export function normalizeApiError(error: unknown): NormalizedError {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 500;
    const envelope = error.response?.data as ApiErrorEnvelope | undefined;

    if (envelope && typeof envelope === 'object' && !envelope.success) {
      return {
        status,
        code: envelope.error_code || 'api_error',
        message: envelope.message || 'Request failed',
        requestId: envelope.details?.request_id
      };
    }

    return {
      status,
      code: 'network_error',
      message: error.message || 'Network request failed'
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      code: 'unknown_error',
      message: error.message
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
