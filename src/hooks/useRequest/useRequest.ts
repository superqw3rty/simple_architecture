import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useLatestRef } from '../useLatestRef';
import { fetchEntry } from './fetchEntry';
import { getEntry, serializeKey, subscribe } from './requestCache';
import type { CacheEntry, RequestOptions, RequestResult } from './types';

/**
 * Loads data and keeps it in the app-wide cache. A minimal replacement for useQuery.
 *
 * - Requests with the same `key` share one cache entry and one network call.
 * - Changing `key` cancels the previous request (if no other component waits for it)
 *   and starts a new one; a late response of the old request is ignored.
 * - Data younger than `staleTime` is served from the cache without a network call;
 *   older data is shown immediately and refreshed in the background.
 *
 * Full description, statuses and scenarios: ./README.md
 *
 * @example
 * const { data, status, error, refetch } = useRequest({
 *   key: ['shows', 'search', term],
 *   fn: ({ signal }) => searchShows(term, signal),
 *   enabled: term.length > 0,
 *   staleTime: 5 * 60_000,
 * });
 */
export function useRequest<T>(options: RequestOptions<T>): RequestResult<T> {
  const { key, fn, enabled = true, staleTime = 0 } = options;

  // The cache is addressed by a string, so a new array with the same content is the same key.
  const hash = serializeKey(key);

  // `fn` is usually an inline arrow, i.e. a new function on every render.
  // The ref lets us always call the latest one without restarting the request.
  const fnRef = useLatestRef(fn);

  // Subscribe to the cache entry: any change of it re-renders this component.
  const subscribeToKey = useCallback((listener: () => void) => subscribe(hash, listener), [hash]);
  const getSnapshot = useCallback(() => getEntry(hash) as CacheEntry<T> | undefined, [hash]);
  const entry = useSyncExternalStore(subscribeToKey, getSnapshot);

  // Ask for the data. fetchEntry decides itself whether a network call is really needed.
  // Runs after the subscription above, so the entry already has a subscriber.
  useEffect(() => {
    if (enabled) {
      fetchEntry(hash, (context) => fnRef.current(context), staleTime);
    }
  }, [hash, enabled, staleTime, fnRef]);

  // staleTime = 0 forces a network call even if the cached data is still fresh.
  const refetch = useCallback(() => {
    fetchEntry(hash, (context) => fnRef.current(context), 0);
  }, [hash, fnRef]);

  // No entry yet: either the request is about to start (pending) or it is switched off (idle).
  const status = entry?.status ?? (enabled ? 'pending' : 'idle');

  return {
    data: entry?.data,
    error: entry?.error ?? null,
    status,
    isFetching: entry?.isFetching ?? enabled,
    refetch,
  };
}
