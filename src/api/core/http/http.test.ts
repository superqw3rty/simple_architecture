import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiError } from '../ApiError';
import { request } from './http';

// API_URL is read on import: a getter lets every case pick its own value.
const config = vi.hoisted(() => ({ apiUrl: '' }));
vi.mock('../config', () => ({
  get API_URL(): string {
    return config.apiUrl;
  },
}));

const stubFetch = (
  impl: () => Promise<unknown>,
): Mock<(...args: unknown[]) => Promise<unknown>> => {
  const mock = vi.fn(impl);
  vi.stubGlobal('fetch', mock);
  return mock;
};

const okJson = (): Promise<Response> => Promise.resolve(Response.json({}));

describe('request', () => {
  beforeEach(() => {
    config.apiUrl = '';
  });

  it('builds the query string and returns parsed JSON', async () => {
    const mock = stubFetch(() => Promise.resolve(Response.json([1, 2])));

    const data = await request<number[]>('https://x.test/items', {
      params: { q: 'a b', skip: undefined },
    });

    expect(data).toEqual([1, 2]);
    expect(mock).toHaveBeenCalledWith(
      'https://x.test/items?q=a+b',
      expect.objectContaining({ method: 'GET', body: undefined }),
    );
  });

  it('keeps a path relative when API_URL is empty, so Vite proxies it', async () => {
    const mock = stubFetch(okJson);

    await request('/api/shows', { params: { q: 'murder' } });

    expect(mock.mock.calls[0]?.[0]).toBe('/api/shows?q=murder');
  });

  it('puts API_URL in front of a path', async () => {
    config.apiUrl = 'https://api.example.test';
    const mock = stubFetch(okJson);

    await request('/api/shows', { params: { q: 'murder' } });

    expect(mock.mock.calls[0]?.[0]).toBe('https://api.example.test/api/shows?q=murder');
  });

  it('leaves an absolute URL as is', async () => {
    config.apiUrl = 'https://api.example.test';
    const mock = stubFetch(okJson);

    await request('https://x.test/items');

    expect(mock.mock.calls[0]?.[0]).toBe('https://x.test/items');
  });

  it('sends the body as JSON', async () => {
    const mock = stubFetch(okJson);

    await request('/api/items/1', { method: 'PUT', body: { id: 1 } });

    expect(mock).toHaveBeenCalledWith(
      '/api/items/1',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{"id":1}',
      }),
    );
  });

  it.each([0, false, '', null])('sends a falsy body %j too', async (body) => {
    const mock = stubFetch(okJson);

    await request('/api/items', { method: 'PUT', body });

    expect(mock.mock.calls[0]?.[1]).toMatchObject({ body: JSON.stringify(body) });
  });

  it('rejects with ApiError carrying the status', async () => {
    stubFetch(() => Promise.resolve(new Response(null, { status: 503 })));

    await expect(request('https://x.test')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
    });
  });

  it('wraps network failures into ApiError', async () => {
    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    await expect(request('https://x.test')).rejects.toBeInstanceOf(ApiError);
  });

  it('rethrows AbortError untouched', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    stubFetch(() => Promise.reject(abort));

    await expect(request('https://x.test')).rejects.toBe(abort);
  });
});
