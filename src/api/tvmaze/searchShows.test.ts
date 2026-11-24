import { describe, expect, it, vi, type Mock } from 'vitest';
import { searchShows } from './searchShows';

const stubFetch = (response: () => Response): Mock<() => Promise<Response>> => {
  const mock = vi.fn(() => Promise.resolve(response()));
  vi.stubGlobal('fetch', mock);
  return mock;
};

const RESPONSE = [
  { score: 0.9, show: { id: 1, name: 'Murder', genres: ['Crime'], premiered: '2012-08-26' } },
  { score: 0.5, show: { id: 2, name: 'Murder One', genres: [], premiered: null } },
];

describe('searchShows', () => {
  it('calls the search endpoint with the query and the signal', async () => {
    const mock = stubFetch(() => Response.json([]));
    const { signal } = new AbortController();

    await searchShows('kill bill', signal);

    expect(mock).toHaveBeenCalledWith('https://api.tvmaze.com/search/shows?q=kill+bill', {
      signal,
    });
  });

  it('returns mapped shows in the order of the response', async () => {
    stubFetch(() => Response.json(RESPONSE));

    const shows = await searchShows('murder');

    expect(shows).toHaveLength(2);
    expect(shows[0]).toMatchObject({ id: 1, name: 'Murder', genres: ['Crime'], year: 2012 });
    expect(shows[1]).toMatchObject({ id: 2, name: 'Murder One', year: null });
  });

  it('returns an empty list when nothing is found', async () => {
    stubFetch(() => Response.json([]));

    await expect(searchShows('qwertyzxcv')).resolves.toEqual([]);
  });

  it('rejects with ApiError when the server fails', async () => {
    stubFetch(() => new Response(null, { status: 500 }));

    await expect(searchShows('murder')).rejects.toMatchObject({ name: 'ApiError', status: 500 });
  });
});
