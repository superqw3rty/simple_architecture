import { QueryClient } from '@tanstack/react-query';
import type { ShowsPage } from '#shared';
import { describe, expect, it, vi, type Mock } from 'vitest';
import type { ShowsPageParams } from '../fetchShowsPage';
import { showQueries } from './showQueries';

const stubFetch = (response: () => Response): Mock<typeof fetch> => {
  const mock = vi.fn<typeof fetch>(() => Promise.resolve(response()));
  vi.stubGlobal('fetch', mock);
  return mock;
};

const PARAMS: ShowsPageParams = { term: 'murder', genre: null, page: 1 };

const PAGE: ShowsPage = {
  items: [],
  page: 1,
  totalPages: 1,
  total: 0,
  pageSize: 3,
  genres: [],
  totalAll: 0,
};

/** Calls the factory's placeholderData the way TanStack Query does on a key change. */
function placeholderFor(params: ShowsPageParams, previousParams: ShowsPageParams): unknown {
  const options = showQueries.page(params);
  const placeholder = options.placeholderData;
  if (typeof placeholder !== 'function') {
    throw new Error('placeholderData is expected to be a function');
  }
  // A real Query for the previous key, built in a fresh cache without fetching.
  const client = new QueryClient();
  const queryKey = [...showQueries.pages(), previousParams] as const;
  const previousQuery = client
    .getQueryCache()
    .build<ShowsPage, Error, ShowsPage, typeof queryKey>(client, { queryKey });
  return placeholder(PAGE, previousQuery);
}

describe('showQueries.page', () => {
  it('keys the query by term, genre and page under the shows prefix', () => {
    const { queryKey } = showQueries.page({ term: 'murder', genre: 'Crime', page: 2 });

    expect(queryKey).toEqual(['shows', 'page', { term: 'murder', genre: 'Crime', page: 2 }]);
    expect(queryKey.slice(0, 2)).toEqual(showQueries.pages());
    expect(queryKey.slice(0, 1)).toEqual(showQueries.all());
  });

  it('is disabled for an empty term', () => {
    expect(showQueries.page({ ...PARAMS, term: '' }).enabled).toBe(false);
    expect(showQueries.page(PARAMS).enabled).toBe(true);
  });

  it('keeps the previous page while another page or genre of the same term loads', () => {
    expect(placeholderFor({ ...PARAMS, page: 2 }, PARAMS)).toBe(PAGE);
    expect(placeholderFor({ ...PARAMS, genre: 'Crime' }, PARAMS)).toBe(PAGE);
  });

  it('shows no placeholder for a new term', () => {
    expect(placeholderFor({ ...PARAMS, term: 'batman' }, PARAMS)).toBeUndefined();
  });

  it('loads the page and passes the abort signal down to fetch', async () => {
    const mock = stubFetch(() => Response.json(PAGE));
    const client = new QueryClient();

    const data = await client.fetchQuery(showQueries.page({ ...PARAMS, page: 2 }));

    expect(data).toEqual(PAGE);
    expect(mock.mock.calls[0]?.[0]).toBe('/api/shows?q=murder&page=2');
    expect(mock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });
});
