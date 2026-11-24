import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { showQueries } from './showQueries';

const stubFetch = (response: () => Response): Mock<typeof fetch> => {
  const mock = vi.fn<typeof fetch>(() => Promise.resolve(response()));
  vi.stubGlobal('fetch', mock);
  return mock;
};

describe('showQueries.search', () => {
  it('keys the query by the term under the shows prefix', () => {
    expect(showQueries.search('murder').queryKey).toEqual(['shows', 'search', 'murder']);
    expect(showQueries.search('murder').queryKey.slice(0, 1)).toEqual(showQueries.all());
  });

  it('is disabled for an empty term', () => {
    expect(showQueries.search('').enabled).toBe(false);
    expect(showQueries.search('kill').enabled).toBe(true);
  });

  it('loads mapped shows and passes the abort signal down to fetch', async () => {
    const mock = stubFetch(() =>
      Response.json([{ score: 1, show: { id: 7, name: 'Kill Bill', genres: null } }]),
    );
    const client = new QueryClient();

    const shows = await client.fetchQuery(showQueries.search('kill bill'));

    expect(shows).toEqual([expect.objectContaining({ id: 7, name: 'Kill Bill', genres: [] })]);
    expect(mock.mock.calls[0]?.[0]).toBe('https://api.tvmaze.com/search/shows?q=kill+bill');
    expect(mock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
