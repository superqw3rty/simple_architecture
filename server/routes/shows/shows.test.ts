import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '#server/app.ts';
import { resetCache } from '#server/entities/cache.ts';
import type { TvMazeSearchResult, TvMazeShow } from '#server/tvmaze/types.ts';
import type { ApiErrorBody, ShowsPage } from '#shared';

// Only the fields that matter here; mapShow tolerates the rest being absent.
const result = (id: number, genres: string[]): TvMazeSearchResult => ({
  score: 1,
  show: { id, name: `Show ${id}`, genres } as TvMazeShow,
});

const RESPONSE = [
  result(1, ['Drama']),
  result(2, ['Comedy']),
  result(3, ['Drama']),
  result(4, ['Drama']),
];

const fetchMock = vi.fn<typeof fetch>();

const get = async (query: string): Promise<Response> => app.request(`/api/shows${query}`);
const ids = (page: ShowsPage): number[] => page.items.map((item) => item.id);

describe('GET /api/shows', () => {
  beforeEach(() => {
    resetCache();
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => Promise.resolve(Response.json(RESPONSE)));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('answers with the first page of the search', async () => {
    const response = await get('?q=%20murder%20');
    const page = (await response.json()) as ShowsPage;

    expect(response.status).toBe(200);
    expect(ids(page)).toEqual([1, 2, 3]);
    expect(page).toMatchObject({ page: 1, totalPages: 2, total: 4, totalAll: 4, pageSize: 3 });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/search/shows?q=murder');
  });

  it('returns the requested page', async () => {
    const page = (await (await get('?q=murder&page=2')).json()) as ShowsPage;

    expect(ids(page)).toEqual([4]);
    expect(page.page).toBe(2);
  });

  it('filters by genre', async () => {
    const page = (await (await get('?q=murder&genre=Drama')).json()) as ShowsPage;

    expect(ids(page)).toEqual([1, 3, 4]);
    expect(page).toMatchObject({ total: 3, totalAll: 4, totalPages: 1 });
  });

  it('treats an empty genre as no filter', async () => {
    const page = (await (await get('?q=murder&genre=')).json()) as ShowsPage;

    expect(page.total).toBe(4);
  });

  it('falls back to a valid page for a broken or too large one', async () => {
    const broken = (await (await get('?q=murder&page=abc')).json()) as ShowsPage;
    const tooLarge = (await (await get('?q=murder&page=99')).json()) as ShowsPage;

    expect(broken.page).toBe(1);
    expect(tooLarge.page).toBe(2);
  });

  it.each(['', '?q=', '?q=%20%20', '?term=murder'])(
    'answers 400 without a term: "%s"',
    async (query) => {
      const response = await get(query);

      expect(response.status).toBe(400);
      expect(((await response.json()) as ApiErrorBody).error).toBeTruthy();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('answers 502 when TVmaze fails', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('oops', { status: 500 })));

    const response = await get('?q=murder');

    expect(response.status).toBe(502);
  });

  it('asks TVmaze once for the same term, whatever the genre and page', async () => {
    await get('?q=murder');
    await get('?q=murder&genre=Drama&page=2');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
