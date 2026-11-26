import { beforeEach, describe, expect, it } from 'vitest';
import type { CacheEntry } from './cache.ts';
import { getCacheEntry, MAX_CACHE_ENTRIES, resetCache, setCacheEntry } from './cache.ts';

const entry = (data: unknown): CacheEntry => ({ data, expiresAt: 1 });

const fill = (count: number): void => {
  for (let index = 0; index < count; index += 1) {
    setCacheEntry(`key-${index}`, entry(index));
  }
};

describe('cache', () => {
  beforeEach(() => {
    resetCache();
  });

  it('returns what was stored and nothing for an unknown key', () => {
    setCacheEntry('a', entry('A'));

    expect(getCacheEntry('a')).toEqual(entry('A'));
    expect(getCacheEntry('b')).toBeUndefined();
  });

  it('keeps every entry up to the limit', () => {
    fill(MAX_CACHE_ENTRIES);

    expect(getCacheEntry('key-0')).toBeDefined();
    expect(getCacheEntry(`key-${MAX_CACHE_ENTRIES - 1}`)).toBeDefined();
  });

  it('drops the oldest entry when one more comes in', () => {
    fill(MAX_CACHE_ENTRIES + 1);

    expect(getCacheEntry('key-0')).toBeUndefined();
    expect(getCacheEntry('key-1')).toBeDefined();
    expect(getCacheEntry(`key-${MAX_CACHE_ENTRIES}`)).toBeDefined();
  });

  it('treats a rewritten entry as the newest', () => {
    fill(MAX_CACHE_ENTRIES);
    setCacheEntry('key-0', entry('refreshed'));
    setCacheEntry('extra', entry('extra'));

    expect(getCacheEntry('key-0')).toEqual(entry('refreshed'));
    expect(getCacheEntry('key-1')).toBeUndefined();
  });

  it('forgets everything on reset', () => {
    fill(3);
    resetCache();

    expect(getCacheEntry('key-0')).toBeUndefined();
  });
});
