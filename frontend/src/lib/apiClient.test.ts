import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, ApiClientError } from './apiClient';
import { useUiStore } from '../store/ui';

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  });
}

describe('apiFetch', () => {
  beforeEach(() => {
    useUiStore.getState().clearApiIssue();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes /api-prefixed endpoints to avoid /api/api duplication', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch<{ ok: boolean }>('/api/products');

    const [url] = fetchMock.mock.calls[0];
    const resolvedUrl = String(url);
    expect(resolvedUrl).toMatch(/\/api\/products$/);
    expect(resolvedUrl).not.toContain('/api/api/');
  });

  it('retries GET once on network failure', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Network down'))
      .mockResolvedValueOnce(jsonResponse({ success: true }));

    vi.stubGlobal('fetch', fetchMock);

    const response = await apiFetch<{ success: boolean }>('/products', { method: 'GET', retryCount: 1 });
    expect(response.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-GET requests', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/products', { method: 'POST', body: JSON.stringify({}) })).rejects.toBeInstanceOf(ApiClientError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('classifies server errors with status code', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          success: false,
          error_code: 'internal_error',
          message: 'boom'
        },
        500
      )
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/products')).rejects.toMatchObject({
      type: 'server',
      status: 500
    });
  });

  it('classifies timeout aborts', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/products', { timeoutMs: 1, retryCount: 0 })).rejects.toMatchObject({
      type: 'timeout',
      status: 408
    });
  });

  it('handles empty response bodies safely', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('', {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const response = await apiFetch<null>('/products');
    expect(response).toBeNull();
  });

  it('throws bad_json when content-type is json but body is invalid', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{not-json', {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/products')).rejects.toMatchObject({
      type: 'bad_json',
      status: 200
    });
  });

  it('handles non-json successful responses gracefully', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('ok', {
        status: 200,
        headers: {
          'content-type': 'text/plain'
        }
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const response = await apiFetch<string>('/products');
    expect(response).toBe('ok');
  });
});
