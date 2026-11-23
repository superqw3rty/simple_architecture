import { queryOptions } from '@tanstack/react-query';
import { searchShows } from './searchShows';

/** TVmaze search results barely change: serve them from the cache for 5 minutes. */
const SEARCH_STALE_TIME = 5 * 60_000;

/**
 * Query factory for shows: the single place that knows the query keys and wires
 * `signal` into the endpoints. Features pass these to useQuery and never build keys by hand.
 *
 * Keys are hierarchical, so `invalidateQueries({ queryKey: showQueries.all() })`
 * drops every show query at once.
 *
 * @example
 * const term = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
 * const search = useQuery(showQueries.search(term));
 */
export const showQueries = {
  all: () => ['shows'] as const,

  searches: () => [...showQueries.all(), 'search'] as const,

  /** Disabled for an empty term: the initial screen sends no request. Pass a trimmed term. */
  search: (term: string) =>
    queryOptions({
      queryKey: [...showQueries.searches(), term] as const,
      queryFn: ({ signal }) => searchShows(term, signal),
      enabled: term.length > 0,
      staleTime: SEARCH_STALE_TIME,
    }),
};
