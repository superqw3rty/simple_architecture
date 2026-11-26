import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpstreamError } from '#server/error.ts';
import type { TvMazeSearchResult, TvMazeShow } from '#server/tvmaze/types.ts';
import { fetchWithCache } from '../fetchWithCache/index.ts';
import { searchShows } from './searchShows.ts';

vi.mock('../fetchWithCache/index.ts', () => ({ fetchWithCache: vi.fn() }));

const fetchMock = vi.mocked(fetchWithCache);

// Only the fields that matter here; mapShow tolerates the rest being absent.
const result = (id: number, genres: string[]): TvMazeSearchResult => ({
  score: 1,
  show: { id, name: `Show ${id}`, genres } as TvMazeShow,
});

const RESPONSE = [
  result(1, ['Drama']),
  result(2, ['Drama', 'Crime']),
  result(3, ['Comedy']),
  result(4, ['Drama']),
  result(5, []),
];

const ids = (page: { items: { id: number }[] }): number[] => page.items.map((item) => item.id);

describe('searchShows', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(RESPONSE);
  });

  it('asks TVmaze with an encoded term', async () => {
    await searchShows({ term: 'a&b c', genre: null, page: 1 });

    expect(fetchMock).toHaveBeenCalledWith('/search/shows?q=a%26b%20c');
  });

  it('returns the first page of the whole search', async () => {
    const page = await searchShows({ term: 'x', genre: null, page: 1 });

    expect(ids(page)).toEqual([1, 2, 3]);
    expect(page).toMatchObject({ page: 1, totalPages: 2, total: 5, totalAll: 5, pageSize: 3 });
    expect(page.items.every((item) => !item.isFavorite)).toBe(true);
  });

  it('returns the requested page', async () => {
    const page = await searchShows({ term: 'x', genre: null, page: 2 });

    expect(ids(page)).toEqual([4, 5]);
    expect(page.page).toBe(2);
  });

  it('filters by genre but counts genres over the whole search', async () => {
    const page = await searchShows({ term: 'x', genre: 'Drama', page: 1 });

    expect(ids(page)).toEqual([1, 2, 4]);
    expect(page).toMatchObject({ total: 3, totalAll: 5, totalPages: 1 });
    expect(page.genres).toEqual([
      { name: 'Drama', count: 3 },
      { name: 'Comedy', count: 1 },
      { name: 'Crime', count: 1 },
    ]);
  });

  it('passes a TVmaze failure through', async () => {
    fetchMock.mockRejectedValue(new UpstreamError('down'));

    await expect(searchShows({ term: 'x', genre: null, page: 1 })).rejects.toBeInstanceOf(
      UpstreamError,
    );
  });
});
