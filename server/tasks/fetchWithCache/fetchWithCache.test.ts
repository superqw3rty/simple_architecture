import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetCache } from '#server/entities/cache.ts';
import { UpstreamError } from '#server/error.ts';
import { requestTvMaze } from '#server/tvmaze/request.ts';
import { fetchWithCache } from './fetchWithCache.ts';

// The cache mechanics are covered by getOrLoad.test.ts; here — the TVmaze rule on top of them.
vi.mock('#server/tvmaze/request.ts', () => ({ requestTvMaze: vi.fn() }));

const request = vi.mocked(requestTvMaze);

const NOW = 1_000_000;
const MINUTE = 60 * 1000;
const PATH = '/search/shows?q=murder';

describe('fetchWithCache', () => {
  beforeEach(() => {
    resetCache();
    request.mockReset();
  });

  it('asks TVmaze for the given path', async () => {
    request.mockResolvedValue(['fresh']);

    await expect(fetchWithCache(PATH, NOW)).resolves.toEqual(['fresh']);
    expect(request).toHaveBeenCalledWith(PATH);
  });

  it('repeats a request only after 5 minutes', async () => {
    request.mockResolvedValueOnce(['old']).mockResolvedValueOnce(['new']);
    await fetchWithCache(PATH, NOW);

    await expect(fetchWithCache(PATH, NOW + 5 * MINUTE - 1)).resolves.toEqual(['old']);
    await expect(fetchWithCache(PATH, NOW + 5 * MINUTE)).resolves.toEqual(['new']);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('caches each path separately', async () => {
    request.mockResolvedValueOnce(['murder']).mockResolvedValueOnce(['comedy']);

    await fetchWithCache(PATH, NOW);
    await expect(fetchWithCache('/search/shows?q=comedy', NOW)).resolves.toEqual(['comedy']);
  });

  it('passes a TVmaze failure through and does not cache it', async () => {
    request.mockRejectedValueOnce(new UpstreamError('down')).mockResolvedValueOnce(['back']);

    await expect(fetchWithCache(PATH, NOW)).rejects.toBeInstanceOf(UpstreamError);
    await expect(fetchWithCache(PATH, NOW + 1)).resolves.toEqual(['back']);
  });
});
