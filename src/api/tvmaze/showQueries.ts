import { queryOptions } from '@tanstack/react-query';
import type { Show } from '@/types/show';
import { searchShows } from './searchShows';

/** TVmaze search results barely change: serve them from the cache for 5 minutes. */
const SEARCH_STALE_TIME = 5 * 60_000;

type ShowsKey = readonly ['shows'];
type ShowsSearchesKey = readonly [...ShowsKey, 'search'];
type ShowsSearchKey = readonly [...ShowsSearchesKey, string];

/** Options for useQuery: the queryKey is tagged with Show[], so the cache knows the data type. */
type ShowsSearchOptions = ReturnType<typeof queryOptions<Show[], Error, Show[], ShowsSearchKey>>;

/**
 * Query factory for shows: the single place that knows the query keys and wires
 * `signal` into the endpoints. Features pass these to useQuery and never build keys by hand.
 *
 * Keys are hierarchical, so `invalidateQueries({ queryKey: showQueries.all() })`
 * drops every show query at once.
 *
 * @example
 * const search = useQuery(showQueries.search(term)); // term: trimmed and debounced
 */
export const showQueries = {
  all: (): ShowsKey => ['shows'] as const,

  searches: (): ShowsSearchesKey => [...showQueries.all(), 'search'] as const,

  /** Disabled for an empty term: the initial screen sends no request. Pass a trimmed term. */
  search: (term: string): ShowsSearchOptions =>
    queryOptions({
      queryKey: [...showQueries.searches(), term] as const,
      queryFn: ({ signal }) => searchShows(term, signal),
      enabled: term.length > 0,
      staleTime: SEARCH_STALE_TIME,
    }),
};
