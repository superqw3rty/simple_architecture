import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache } from './requestCache';
import type { RequestContext } from './types';
import { useRequest } from './useRequest';

/** A request the test resolves by hand; rejects with AbortError when cancelled. */
function deferred<T>() {
  const calls: { signal: AbortSignal; resolve: (value: T) => void; reject: (e: Error) => void }[] =
    [];
  const fn = vi.fn(({ signal }: RequestContext) => {
    return new Promise<T>((resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      calls.push({ signal, resolve, reject });
    });
  });
  return { fn, calls };
}

beforeEach(() => clearCache());

describe('useRequest', () => {
  it('is idle and sends nothing while disabled', () => {
    const { fn } = deferred<string>();
    const { result } = renderHook(() => useRequest({ key: ['a'], fn, enabled: false }));

    expect(result.current.status).toBe('idle');
    expect(fn).not.toHaveBeenCalled();
  });

  it('goes pending → success', async () => {
    const { fn, calls } = deferred<string>();
    const { result } = renderHook(() => useRequest({ key: ['a'], fn }));

    expect(result.current.status).toBe('pending');
    await act(async () => calls[0]?.resolve('data'));

    expect(result.current).toMatchObject({ status: 'success', data: 'data', isFetching: false });
  });

  it('cancels the previous request when the key changes and ignores its late response', async () => {
    const { fn, calls } = deferred<string>();
    const { result, rerender } = renderHook(({ q }) => useRequest({ key: ['s', q], fn }), {
      initialProps: { q: 'kill' },
    });

    rerender({ q: 'kill bill' });
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[0]?.signal.aborted).toBe(true);

    await act(async () => {
      calls[0]?.resolve('stale');
      calls[1]?.resolve('fresh');
    });

    expect(result.current.data).toBe('fresh');
  });

  it('exposes the error and recovers through refetch', async () => {
    const { fn, calls } = deferred<string>();
    const { result } = renderHook(() => useRequest({ key: ['a'], fn }));

    await act(async () => calls[0]?.reject(new Error('boom')));
    expect(result.current).toMatchObject({ status: 'error', data: undefined });
    expect(result.current.error?.message).toBe('boom');

    act(() => result.current.refetch());
    await act(async () => calls[1]?.resolve('ok'));

    expect(result.current).toMatchObject({ status: 'success', data: 'ok', error: null });
  });

  it('serves fresh data from the app-wide cache without a second call', async () => {
    const { fn, calls } = deferred<string>();
    const options = { key: ['a'], fn, staleTime: 60_000 };
    const first = renderHook(() => useRequest(options));
    await act(async () => calls[0]?.resolve('cached'));
    first.unmount();

    const second = renderHook(() => useRequest(options));

    expect(second.result.current).toMatchObject({ status: 'success', data: 'cached' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('refetches stale data in the background while still showing it', async () => {
    const { fn, calls } = deferred<string>();
    const first = renderHook(() => useRequest({ key: ['a'], fn }));
    await act(async () => calls[0]?.resolve('old'));
    first.unmount();

    const second = renderHook(() => useRequest({ key: ['a'], fn }));
    await waitFor(() => expect(calls).toHaveLength(2));

    expect(second.result.current).toMatchObject({
      status: 'success',
      data: 'old',
      isFetching: true,
    });
  });

  it('shares one network call between simultaneous subscribers of the same key', async () => {
    const { fn, calls } = deferred<string>();
    const a = renderHook(() => useRequest({ key: ['a'], fn }));
    const b = renderHook(() => useRequest({ key: ['a'], fn }));

    await act(async () => calls[0]?.resolve('shared'));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(a.result.current.data).toBe('shared');
    expect(b.result.current.data).toBe('shared');
  });
});
