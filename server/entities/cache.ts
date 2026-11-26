// Entity: what the server remembers between requests. Storage only: freshness rules live in tasks.
export interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

// Memory guard: every unique search adds a key, so the oldest entry goes once the cap is hit.
export const MAX_CACHE_ENTRIES = 500;

const cache: Map<string, CacheEntry> = new Map();

export function getCacheEntry(key: string): CacheEntry | undefined {
  return cache.get(key);
}

export function setCacheEntry(key: string, entry: CacheEntry): void {
  cache.delete(key);
  cache.set(key, entry);

  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;

    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
}

export function resetCache(): void {
  cache.clear();
}
