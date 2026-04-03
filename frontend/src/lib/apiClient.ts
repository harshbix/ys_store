import { API_BASE_URL } from '../config/api';
import { useUiStore, type ApiIssueType } from '../store/ui';
import type { ApiErrorEnvelope } from '../types/api';

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRY_COUNT = 1;
const SHOULD_INCLUDE_CREDENTIALS = true;

export type ApiErrorType = 'network' | 'timeout' | 'server' | 'http_error' | 'bad_json' | 'misconfiguration';

interface ApiClientErrorArgs {
  status: number;
  code: string;
  message: string;
  type: ApiErrorType;
  method: string;
  url: string;
  endpoint: string;
  baseUrl: string;
  requestId?: string | null;
  details?: unknown;
  retriable?: boolean;
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  type: ApiErrorType;
  method: string;
  url: string;
  endpoint: string;
  baseUrl: string;
  requestId?: string | null;
  details?: unknown;
  retriable: boolean;

  constructor(args: ApiClientErrorArgs) {
    super(args.message);
    this.name = 'ApiClientError';
    this.status = args.status;
    this.code = args.code;
    this.type = args.type;
    this.method = args.method;
    this.url = args.url;
    this.endpoint = args.endpoint;
    this.baseUrl = args.baseUrl;
    this.requestId = args.requestId;
    this.details = args.details;
    this.retriable = Boolean(args.retriable);
  }
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  retryCount?: number;
}

function normalizeEndpoint(endpoint: string): string {
  const raw = endpoint?.trim() || '/';
  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/');

  if (/^\/api(?:\/|$)/i.test(collapsed)) {
    console.warn('[API CONFIG] Endpoint should not include /api prefix. Normalizing endpoint.', { endpoint: collapsed });
    const stripped = collapsed.replace(/^\/api/i, '');
    return stripped ? (stripped.startsWith('/') ? stripped : `/${stripped}`) : '/';
  }

  return collapsed;
}

function joinUrl(baseUrl: string, endpoint: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.replace(/^\/+/, '/');
  return normalizedEndpoint === '/'
    ? normalizedBase
    : `${normalizedBase}${normalizedEndpoint}`;
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseJsonStrict(value: string): unknown {
  return JSON.parse(value);
}

function isJsonResponse(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return /application\/json|\+json/i.test(contentType);
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

function canRetry(error: ApiClientError): boolean {
  return error.type === 'network' || error.type === 'timeout';
}

function toIssueType(errorType: ApiErrorType): ApiIssueType {
  switch (errorType) {
    case 'network':
      return 'network';
    case 'timeout':
      return 'timeout';
    case 'server':
      return 'server';
    case 'bad_json':
      return 'bad_json';
    case 'misconfiguration':
      return 'missing_env';
    default:
      return 'http_error';
  }
}

function reportApiIssue(error: ApiClientError): void {
  if (error.type === 'http_error' && error.status < 500) {
    return;
  }

  useUiStore.getState().setApiIssue({
    type: toIssueType(error.type),
    message: error.message,
    status: error.status,
    endpoint: error.endpoint
  });
}

function clearTransientApiIssue(): void {
  const { apiIssueType, clearApiIssue } = useUiStore.getState();
  if (apiIssueType && apiIssueType !== 'missing_env') {
    clearApiIssue();
  }
}

function logApiError(error: ApiClientError): void {
  console.error('[API FETCH FAILED]', {
    endpoint: error.endpoint,
    baseUrl: error.baseUrl,
    status: error.status,
    type: error.type,
    method: error.method,
    url: error.url,
    message: error.message
  });
}

function toApiClientError(error: unknown, args: { endpoint: string; method: string; url: string }): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  const isAbortError = error instanceof DOMException && error.name === 'AbortError';
  const isNetworkError = error instanceof TypeError;

  if (isAbortError) {
    return new ApiClientError({
      status: 408,
      code: 'timeout',
      type: 'timeout',
      message: 'Request timed out',
      endpoint: args.endpoint,
      method: args.method,
      url: args.url,
      baseUrl: API_BASE_URL,
      details: error,
      retriable: true
    });
  }

  if (isNetworkError) {
    return new ApiClientError({
      status: 0,
      code: 'network_error',
      type: 'network',
      message: 'Network request failed',
      endpoint: args.endpoint,
      method: args.method,
      url: args.url,
      baseUrl: API_BASE_URL,
      details: error,
      retriable: true
    });
  }

  return new ApiClientError({
    status: 500,
    code: 'unknown_error',
    type: 'network',
    message: error instanceof Error ? error.message : 'Unexpected request failure',
    endpoint: args.endpoint,
    method: args.method,
    url: args.url,
    baseUrl: API_BASE_URL,
    details: error,
    retriable: false
  });
}

export async function apiFetch<T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryCount = DEFAULT_RETRY_COUNT,
    headers,
    signal,
    ...requestOptions
  } = options;

  const method = (requestOptions.method || 'GET').toUpperCase();
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const url = joinUrl(API_BASE_URL, normalizedEndpoint);
  const allowRetry = method === 'GET';
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
        credentials: requestOptions.credentials ?? (SHOULD_INCLUDE_CREDENTIALS ? 'include' : 'same-origin'),
        signal: controller.signal
      });

      const text = await response.text();
      const contentType = response.headers.get('content-type');
      const jsonPayload = tryParseJson(text);

      if (!response.ok) {
        const envelope = toApiEnvelope(jsonPayload);
        const type: ApiErrorType = response.status >= 500 ? 'server' : 'http_error';

        const apiError = new ApiClientError({
          status: response.status,
          code: envelope?.error_code || type,
          type,
          message: envelope?.message || text || response.statusText || 'Request failed',
          endpoint: normalizedEndpoint,
          method,
          url,
          baseUrl: API_BASE_URL,
          requestId: envelope?.details?.request_id,
          details: envelope?.details,
          retriable: false
        });

        throw apiError;
      }

      if (!text) {
        clearTransientApiIssue();
        return null as T;
      }

      if (isJsonResponse(contentType)) {
        try {
          const parsed = parseJsonStrict(text);
          clearTransientApiIssue();
          return parsed as T;
        } catch (jsonError) {
          throw new ApiClientError({
            status: response.status,
            code: 'bad_json',
            type: 'bad_json',
            message: 'Response JSON is invalid',
            endpoint: normalizedEndpoint,
            method,
            url,
            baseUrl: API_BASE_URL,
            details: jsonError,
            retriable: false
          });
        }
      }

      const parsed = jsonPayload;
      clearTransientApiIssue();
      return (parsed === null ? (text as T) : (parsed as T));
    } catch (error) {
      const normalizedError = toApiClientError(error, {
        endpoint: normalizedEndpoint,
        method,
        url
      });

      const shouldRetry = allowRetry && attempt < retryCount && canRetry(normalizedError);
      if (shouldRetry) {
        attempt += 1;
        continue;
      }

      reportApiIssue(normalizedError);
      logApiError(normalizedError);
      throw normalizedError;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
