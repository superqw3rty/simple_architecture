import { getCacheEntry, setCacheEntry } from '#server/entities/cache.ts';

export interface GetOrLoadOptions<T> {
  // Unique across sources: prefix it with the source name, e.g. "tvmaze:/shows/1".
  key: string;
  ttlMs: number;
  load: () => Promise<T>;
  // Passed in by tests to move time; defaults to the clock.
  now?: number;
}

// A failed load is not stored: the error goes to the caller and the next call tries again.
export async function getOrLoad<T>({
  key,
  ttlMs,
  load,
  now = Date.now(),
}: GetOrLoadOptions<T>): Promise<T> {
  const entry = getCacheEntry(key);
  if (entry && entry.expiresAt > now) {
    return entry.data as T;
  }

  const data = await load();
  setCacheEntry(key, { data, expiresAt: now + ttlMs });
  return data;
}
