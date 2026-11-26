import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotFoundError, UpstreamError } from '#server/error.ts';
import { requestTvMaze } from './request.ts';

const stubFetch = (response: Response | Error): ReturnType<typeof vi.fn> => {
  const fetchMock =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('requestTvMaze', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the JSON of a successful response', async () => {
    const fetchMock = stubFetch(Response.json([{ score: 1 }]));

    await expect(requestTvMaze('/search/shows?q=murder')).resolves.toEqual([{ score: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.tvmaze.com/search/shows?q=murder',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('throws NotFoundError on 404', async () => {
    stubFetch(new Response(null, { status: 404 }));

    await expect(requestTvMaze('/shows/0')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws UpstreamError when TVmaze fails', async () => {
    stubFetch(new Response(null, { status: 500 }));

    await expect(requestTvMaze('/shows/1')).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError when TVmaze is unreachable', async () => {
    stubFetch(new TypeError('fetch failed'));

    await expect(requestTvMaze('/shows/1')).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError when the body is not JSON', async () => {
    stubFetch(new Response('<html>', { status: 200 }));

    await expect(requestTvMaze('/shows/1')).rejects.toBeInstanceOf(UpstreamError);
  });
});
