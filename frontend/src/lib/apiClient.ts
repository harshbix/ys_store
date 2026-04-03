import { API_BASE_URL } from '../config/api';
import type { ApiErrorEnvelope } from '../types/api';

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRY_COUNT = 1;

interface ApiFetchErrorArgs {
  status: number;
  code: string;
  message: string;
  endpoint: string;
  baseUrl: string;
  requestId?: string | null;
  details?: unknown;
}

export class ApiFetchError extends Error {
  status: number;
  code: string;
  endpoint: string;
  baseUrl: string;
  requestId?: string | null;
  details?: unknown;

  constructor(args: ApiFetchErrorArgs) {
    super(args.message);
    this.name = 'ApiFetchError';
    this.status = args.status;
    this.code = args.code;
    this.endpoint = args.endpoint;
    this.baseUrl = args.baseUrl;
    this.requestId = args.requestId;
    this.details = args.details;
  }
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  retryCount?: number;
}

function normalizeEndpoint(endpoint: string): string {
  if (!endpoint) return '/';
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

function addApiPrefixWhenNeeded(baseUrl: string, endpoint: string): string {
  const baseHasApiSuffix = /\/api$/i.test(baseUrl);
  const endpointHasApiPrefix = /^\/api(?:\/|$)/i.test(endpoint);

  if (baseHasApiSuffix || endpointHasApiPrefix) {
    return endpoint;
  }

  return endpoint === '/' ? '/api' : `/api${endpoint}`;
}

function buildUrl(endpoint: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const apiAwareEndpoint = addApiPrefixWhenNeeded(normalizedBase, normalizedEndpoint);
  return `${normalizedBase}${apiAwareEndpoint}`;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toApiEnvelope(value: unknown): ApiErrorEnvelope | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<ApiErrorEnvelope>;
  if (candidate.success !== false) return null;
  if (typeof candidate.message !== 'string') return null;

  return candidate as ApiErrorEnvelope;
}

function isFormDataBody(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return false;
  }

  return false;
}

function mergeHeaders(body: BodyInit | null | undefined, customHeaders?: HeadersInit): Headers {
  const headers = new Headers();

  if (!isFormDataBody(body)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!customHeaders) {
    return headers;
  }

  const incoming = new Headers(customHeaders);
  incoming.forEach((value, key) => {
    headers.set(key, value);
  });

  return headers;
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryCount = DEFAULT_RETRY_COUNT,
    headers,
    signal,
    ...requestOptions
  } = options;

  const url = buildUrl(endpoint);
  let attempt = 0;

  while (true) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    if (signal) {
      if (signal.aborted) {
        controller.abort();
      } else {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      const response = await fetch(url, {
        ...requestOptions,
        headers: mergeHeaders(requestOptions.body as BodyInit | null | undefined, headers),
        credentials: requestOptions.credentials ?? 'include',
        signal: controller.signal
      });

      const text = await response.text();

      if (!response.ok) {
        const jsonPayload = toApiEnvelope(tryParseJson(text));

        throw new ApiFetchError({
          status: response.status,
          code: jsonPayload?.error_code || 'api_error',
          message: jsonPayload?.message || text || response.statusText || 'Request failed',
          endpoint,
          baseUrl: API_BASE_URL,
          requestId: jsonPayload?.details?.request_id,
          details: jsonPayload?.details
        });
      }

      if (!text) {
        return null as T;
      }

      const parsed = tryParseJson(text);
      return (parsed === null ? (text as T) : (parsed as T));
    } catch (error) {
      const canRetry = attempt < retryCount && isNetworkFailure(error);
      if (canRetry) {
        attempt += 1;
        continue;
      }

      if (error instanceof ApiFetchError) {
        console.error('[API FETCH FAILED]', {
          endpoint,
          baseUrl: API_BASE_URL,
          error
        });

        throw error;
      }

      const isAbortError = error instanceof DOMException && error.name === 'AbortError';
      const wrapped = new ApiFetchError({
        status: isAbortError ? 408 : 500,
        code: isAbortError ? 'timeout' : 'network_error',
        message: isAbortError ? 'Request timed out' : 'Network request failed',
        endpoint,
        baseUrl: API_BASE_URL,
        details: error
      });

      console.error('[API FETCH FAILED]', {
        endpoint,
        baseUrl: API_BASE_URL,
        error: wrapped
      });

      throw wrapped;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
