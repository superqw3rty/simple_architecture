import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { showQueries, type ShowsPageParams } from '@/api';
import type { ShowsPage } from '@/types/show';

type Filters = Omit<ShowsPageParams, 'term'>;

const FIRST_PAGE: Filters = { genre: null, page: 1 };

interface UseShowsSearchResult {
  // The page from the server; while another page of the same term loads — the previous one.
  results: ShowsPage | null;
  genre: string | null;
  isIdle: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  refetch: UseQueryResult<ShowsPage>['refetch'];
  selectGenre: (genre: string | null) => void;
  changePage: (page: number) => void;
}

export function useShowsSearch(term: string): UseShowsSearchResult {
  const [state, setState] = useState<ShowsPageParams>({ term, ...FIRST_PAGE });
  // A new term starts from all genres and page 1. Derived while rendering, not synced in an effect.
  const params: ShowsPageParams = state.term === term ? state : { term, ...FIRST_PAGE };
  const search = useQuery(showQueries.page(params));

  const update = useCallback(
    (patch: Partial<Filters>): void =>
      setState((prev) => ({ ...(prev.term === term ? prev : { term, ...FIRST_PAGE }), ...patch })),
    [term],
  );
  // Another genre changes the number of pages: start from the first one.
  const selectGenre = useCallback((genre: string | null) => update({ genre, page: 1 }), [update]);
  const changePage = useCallback((page: number) => update({ page }), [update]);

  return {
    results: search.data ?? null,
    genre: params.genre,
    isIdle: term.length === 0,
    isLoading: search.isLoading,
    isFetching: search.isFetching,
    isSuccess: search.isSuccess,
    isError: search.isError,
    refetch: search.refetch,
    selectGenre,
    changePage,
  };
}
