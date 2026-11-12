import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './ApiError';
import { request } from './http';

const stubFetch = (impl: () => Promise<unknown>) => {
  const mock = vi.fn(impl);
  vi.stubGlobal('fetch', mock);
  return mock;
};

describe('request', () => {
  it('builds the query string and returns parsed JSON', async () => {
    const mock = stubFetch(() => Promise.resolve(Response.json([1, 2])));

    const data = await request<number[]>('https://x.test/items', {
      params: { q: 'a b', skip: undefined },
    });

    expect(data).toEqual([1, 2]);
    expect(mock).toHaveBeenCalledWith('https://x.test/items?q=a+b', { signal: undefined });
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
