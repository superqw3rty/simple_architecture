import type { ShowsPage } from '#shared';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { fetchShowsPage } from './fetchShowsPage';

const stubFetch = (response: () => Response): Mock<typeof fetch> => {
  const mock = vi.fn<typeof fetch>(() => Promise.resolve(response()));
  vi.stubGlobal('fetch', mock);
  return mock;
};

const PAGE: ShowsPage = {
  items: [
    {
      id: 1,
      name: 'Murder',
      genres: ['Crime'],
      imageUrl: null,
      rating: null,
      year: 2012,
      language: 'English',
      status: 'Ended',
      summary: '',
      isFavorite: false,
    },
  ],
  page: 1,
  totalPages: 4,
  total: 10,
  pageSize: 3,
  genres: [{ name: 'Crime', count: 5 }],
  totalAll: 10,
};

describe('fetchShowsPage', () => {
  it('asks our API for the term, genre and page and passes the signal', async () => {
    const mock = stubFetch(() => Response.json(PAGE));
    const { signal } = new AbortController();

    await fetchShowsPage({ term: 'kill bill', genre: 'Crime', page: 2 }, signal);

    expect(mock).toHaveBeenCalledWith(
      '/api/shows?q=kill+bill&genre=Crime&page=2',
      expect.objectContaining({ method: 'GET', signal }),
    );
  });

  it('leaves genre out of the URL when no genre is picked', async () => {
    const mock = stubFetch(() => Response.json(PAGE));

    await fetchShowsPage({ term: 'murder', genre: null, page: 1 });

    expect(mock.mock.calls[0]?.[0]).toBe('/api/shows?q=murder&page=1');
  });

  it('returns the page as the server sent it', async () => {
    stubFetch(() => Response.json(PAGE));

    await expect(fetchShowsPage({ term: 'murder', genre: null, page: 1 })).resolves.toEqual(PAGE);
  });

  it('rejects with ApiError when the server fails', async () => {
    stubFetch(() => Response.json({ error: 'TVmaze is unavailable' }, { status: 502 }));

    await expect(fetchShowsPage({ term: 'murder', genre: null, page: 1 })).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
    });
  });
});
