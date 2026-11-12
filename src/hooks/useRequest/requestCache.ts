import type { CacheEntry, RequestKey } from './types';

/** App-wide request cache. Lives outside React, shared by every useRequest call. */
const MAX_ENTRIES = 50;
const entries = new Map<string, CacheEntry>();
const listeners = new Map<string, Set<() => void>>();

export const serializeKey = (key: RequestKey): string => JSON.stringify(key);

export const getEntry = (hash: string): CacheEntry | undefined => entries.get(hash);

const hasListeners = (hash: string): boolean => (listeners.get(hash)?.size ?? 0) > 0;

const notify = (hash: string): void => listeners.get(hash)?.forEach((listener) => listener());

function evictOldest(): void {
  for (const hash of entries.keys()) {
    if (entries.size <= MAX_ENTRIES) {
      return;
    }
    if (!hasListeners(hash)) {
      entries.delete(hash);
    }
  }
}

export function setEntry(hash: string, entry: CacheEntry): void {
  entries.delete(hash); // re-insert to keep the Map ordered by last write
  entries.set(hash, entry);
  evictOldest();
  notify(hash);
}

/** Nobody is waiting for the response anymore: cancel it and roll back to the last settled state. */
function abandon(hash: string): void {
  const entry = entries.get(hash);
  if (!entry?.isFetching) {
    return;
  }

  entry.controller?.abort();
  if (entry.status === 'pending') {
    entries.delete(hash);
  } else {
    entries.set(hash, { ...entry, isFetching: false, controller: null });
  }
}

export function subscribe(hash: string, listener: () => void): () => void {
  const set = listeners.get(hash) ?? new Set();
  listeners.set(hash, set);
  set.add(listener);

  return () => {
    set.delete(listener);
    if (set.size > 0) {
      return;
    }
    listeners.delete(hash);
    abandon(hash);
  };
}

/** Marks matching entries as stale, e.g. invalidate(['shows']) covers ['shows', 'batman']. */
export function invalidate(prefix: RequestKey): void {
  const start = serializeKey(prefix).slice(0, -1);
  for (const [hash, entry] of entries) {
    if (hash.startsWith(start)) {
      entries.set(hash, { ...entry, updatedAt: 0 });
    }
  }
}

export function clearCache(): void {
  for (const entry of entries.values()) {
    entry.controller?.abort();
  }
  entries.clear();
}
