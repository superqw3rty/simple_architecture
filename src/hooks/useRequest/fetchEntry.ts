import { getEntry, setEntry } from './requestCache';
import type { CacheEntry, RequestFn } from './types';

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error('Unknown error');

const isFresh = (entry: CacheEntry, staleTime: number): boolean =>
  entry.status === 'success' && Date.now() - entry.updatedAt < staleTime;

/**
 * Makes sure the cache entry `hash` has (or is getting) up-to-date data.
 *
 * Does nothing when:
 * - a request for this key is already in flight (dedupe: callers share its result);
 * - the cached data is younger than `staleTime`.
 *
 * Otherwise starts `fn`. While it runs, previously loaded data stays visible
 * (status 'success' + isFetching) — only the very first load is 'pending'.
 */
export function fetchEntry<T>(hash: string, fn: RequestFn<T>, staleTime: number): void {
  const previous = getEntry(hash);
  if (previous?.isFetching) {
    return;
  }
  if (previous && isFresh(previous, staleTime)) {
    return;
  }

  // The controller doubles as the identity of this particular request.
  const controller = new AbortController();
  const hasData = previous?.status === 'success';

  setEntry(hash, {
    status: hasData ? 'success' : 'pending',
    data: hasData ? previous.data : undefined,
    error: null,
    updatedAt: previous?.updatedAt ?? 0,
    isFetching: true,
    controller,
  });

  // Race protection: write the response only if this request still owns the entry.
  // It does not when the request was cancelled or the entry was dropped and reloaded.
  const settle = (patch: Pick<CacheEntry, 'status' | 'data' | 'error'>) => {
    if (getEntry(hash)?.controller !== controller) {
      return;
    }
    setEntry(hash, { ...patch, updatedAt: Date.now(), isFetching: false, controller: null });
  };

  // The async wrapper starts fn right away and turns a synchronous throw into a rejection.
  const run = async () => fn({ signal: controller.signal });

  run().then(
    (data) => settle({ status: 'success', data, error: null }),
    (error: unknown) => settle({ status: 'error', data: undefined, error: toError(error) }),
  );
}
