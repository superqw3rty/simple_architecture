import { useQuery } from '@tanstack/react-query';
import { showQueries } from '@/api/tvmaze';
import type { Show } from '@/types/show';

const NO_SHOWS: Show[] = [];

/**
 * Searches TVmaze for a term that is already trimmed and debounced (see useShowsExplorer).
 *
 * - An empty term sends nothing: `isIdle` is true, `shows` is empty.
 * - A new term cancels the previous request; a term seen in the last 5 minutes comes from the cache.
 * - `refetch` after an error with no data puts the query back to pending: `isLoading` is true
 *   and `isError` is false until the answer comes (TanStack Query v5).
 *
 * @example
 * const { shows, isLoading, isError, refetch } = useShowsSearch(term);
 */
export function useShowsSearch(term: string) {
  const search = useQuery(showQueries.search(term));

  return {
    shows: search.data ?? NO_SHOWS,
    isIdle: term.length === 0,
    isLoading: search.isLoading,
    isSuccess: search.isSuccess,
    isError: search.isError,
    error: search.error,
    refetch: search.refetch,
  };
}
