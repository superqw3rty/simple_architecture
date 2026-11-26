import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCache } from '#server/entities/cache.ts';
import { getOrLoad } from './getOrLoad.ts';

const NOW = 1_000_000;
const TTL = 1000;

describe('getOrLoad', () => {
  beforeEach(() => {
    resetCache();
  });

  it('loads when nothing is cached', async () => {
    const load = vi.fn().mockResolvedValue('fresh');

    await expect(getOrLoad({ key: 'k', ttlMs: TTL, load, now: NOW })).resolves.toBe('fresh');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('answers from the cache until the TTL runs out', async () => {
    const load = vi.fn().mockResolvedValue('first');
    await getOrLoad({ key: 'k', ttlMs: TTL, load, now: NOW });

    await expect(getOrLoad({ key: 'k', ttlMs: TTL, load, now: NOW + TTL - 1 })).resolves.toBe(
      'first',
    );
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('loads again once the entry is TTL old and keeps the new value', async () => {
    const load = vi.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new');
    await getOrLoad({ key: 'k', ttlMs: TTL, load, now: NOW });

    await expect(getOrLoad({ key: 'k', ttlMs: TTL, load, now: NOW + TTL })).resolves.toBe('new');
    await expect(getOrLoad({ key: 'k', ttlMs: TTL, load, now: NOW + TTL + 1 })).resolves.toBe(
      'new',
    );
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed load', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce('back');

    await expect(getOrLoad({ key: 'k', ttlMs: TTL, load, now: NOW })).rejects.toThrow('down');
    await expect(getOrLoad({ key: 'k', ttlMs: TTL, load, now: NOW + 1 })).resolves.toBe('back');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('keeps different keys apart', async () => {
    await getOrLoad({ key: 'a', ttlMs: TTL, load: async () => 'A', now: NOW });

    await expect(
      getOrLoad({ key: 'b', ttlMs: TTL, load: async () => 'B', now: NOW }),
    ).resolves.toBe('B');
  });
});
