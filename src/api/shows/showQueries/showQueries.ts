import { queryOptions } from '@tanstack/react-query';
import type { ShowsPage } from '#shared';
import { fetchShowsPage, type ShowsPageParams } from '../fetchShowsPage';

/** A page of one search barely changes: serve it from the cache for 5 minutes. */
const PAGE_STALE_TIME = 5 * 60_000;

type ShowsKey = readonly ['shows'];
type ShowsPagesKey = readonly [...ShowsKey, 'page'];
type ShowsPageKey = readonly [...ShowsPagesKey, ShowsPageParams];

/** Options for useQuery: the queryKey is tagged with ShowsPage, so the cache knows the data type. */
type ShowsPageOptions = ReturnType<typeof queryOptions<ShowsPage, Error, ShowsPage, ShowsPageKey>>;

/**
 * Query factory for shows: the single place that knows the query keys and wires
 * `signal` into the endpoints. Features pass these to useQuery and never build keys by hand.
 *
 * Keys are hierarchical, so `invalidateQueries({ queryKey: showQueries.all() })`
 * drops every show query at once.
 *
 * @example
 * const results = useQuery(showQueries.page({ term, genre, page })); // term: trimmed and debounced
 */
export const showQueries = {
  all: (): ShowsKey => ['shows'] as const,

  pages: (): ShowsPagesKey => [...showQueries.all(), 'page'] as const,

  /**
   * One page of results. Disabled for an empty term: the initial screen sends no request.
   *
   * While the next page or genre loads, the previous page of the same term stays as
   * placeholder data, so paging does not flash the skeleton. A new term gets no placeholder:
   * the old search must not pass for the new one.
   */
  page: ({ term, genre, page }: ShowsPageParams): ShowsPageOptions =>
    queryOptions({
      queryKey: [...showQueries.pages(), { term, genre, page }] as const,
      queryFn: ({ signal }) => fetchShowsPage({ term, genre, page }, signal),
      enabled: term.length > 0,
      staleTime: PAGE_STALE_TIME,
      placeholderData: (previous, previousQuery) =>
        previousQuery?.queryKey[2].term === term ? previous : undefined,
    }),
};
