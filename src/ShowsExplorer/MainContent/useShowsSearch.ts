import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { showQueries } from '@/api/tvmaze';
import type { Show } from '@/types/show';

const NO_SHOWS: Show[] = [];

interface UseShowsSearchResult {
  shows: Show[];
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  refetch: UseQueryResult<Show[]>['refetch'];
}

export function useShowsSearch(term: string): UseShowsSearchResult {
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
