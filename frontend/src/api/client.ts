import { useSessionStore } from '../store/session';
import { useAdminAuthStore, useAuthStore } from '../store/auth';
import { apiFetch, type ApiFetchOptions } from '../lib/apiClient';
import { ApiClientError } from '../lib/apiClient';

interface ApiRequestConfig {
  headers?: HeadersInit;
  params?: object;
  signal?: AbortSignal;
  timeoutMs?: number;
  retryCount?: number;
  credentials?: RequestCredentials;
}

interface ApiResponse<T> {
  data: T;
}

function withQueryParams(endpoint: string, params?: object): string {
  if (!params) {
    return endpoint;
  }

  const [path, existingQuery = ''] = endpoint.split('?');
  const searchParams = new URLSearchParams(existingQuery);

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (
          item !== undefined
          && item !== null
          && (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')
        ) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      searchParams.append(key, String(value));
    }
  });

  const serialized = searchParams.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function withAuthHeaders(endpoint: string, inputHeaders?: HeadersInit): Headers {
  const headers = new Headers(inputHeaders);
  const { guestSessionId } = useSessionStore.getState();

  if (guestSessionId && !headers.has('x-guest-session')) {
    headers.set('x-guest-session', guestSessionId);
  }

  if (!headers.has('Authorization')) {
    const customerToken = useAuthStore.getState().accessToken;
    const adminToken = useAdminAuthStore.getState().token;

    if (adminToken && endpoint.startsWith('/admin')) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    } else if (customerToken && endpoint.startsWith('/auth')) {
      headers.set('Authorization', `Bearer ${customerToken}`);
    }
  }

  return headers;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (
    typeof body === 'string'
    || body instanceof FormData
    || body instanceof URLSearchParams
    || body instanceof Blob
  ) {
    return body;
  }

  return JSON.stringify(body);
}

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  const { params, headers, ...requestConfig } = config;
  const resolvedEndpoint = withQueryParams(endpoint, params);

  const options: ApiFetchOptions = {
    ...requestConfig,
    method,
    headers: withAuthHeaders(endpoint, headers),
    body: serializeBody(body)
  };

  try {
    const data = await apiFetch<T>(resolvedEndpoint, options);
    return { data };
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      const requestHeaders = new Headers(options.headers);
      const hasAuthHeader = requestHeaders.has('Authorization');

      if (hasAuthHeader) {
        if (resolvedEndpoint.startsWith('/admin')) {
          useAdminAuthStore.getState().clearSession();
        } else if (resolvedEndpoint.startsWith('/auth')) {
          useAuthStore.getState().logout();
        }
      }
    }

    throw error;
  }
}

export const apiClient = {
  get<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>('GET', endpoint, undefined, config);
  },
  post<T>(endpoint: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>('POST', endpoint, body, config);
  },
  put<T>(endpoint: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>('PUT', endpoint, body, config);
  },
  patch<T>(endpoint: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>('PATCH', endpoint, body, config);
  },
  delete<T>(endpoint: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return request<T>('DELETE', endpoint, undefined, config);
  }
};
