import { useRef, type RefObject } from 'react';
import type { ShowsPage } from '@/types/show';
import { getAnnouncement } from './utils/getAnnouncement';
import { formatEmptyTitle } from './utils/formatEmptyTitle';
import { useShowsSearch } from './hooks/useShowsSearch';

interface UseMainContentResult {
  mainRef: RefObject<HTMLElement | null>;
  // Set only when there is something to list: an empty search is isEmpty instead.
  results: ShowsPage | null;
  genre: string | null;
  isIdle: boolean;
  isLoading: boolean;
  isBusy: boolean;
  hasError: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  announcement: string;
  onRetry: () => void;
  onGenreChange: (genre: string | null) => void;
  onPageChange: (page: number) => void;
}

export function useMainContent(term: string): UseMainContentResult {
  const search = useShowsSearch(term);
  const { results, isLoading, isSuccess, isError } = search;
  const mainRef = useRef<HTMLElement>(null);
  // The whole search, before the genre filter: picking a genre is not a new search to announce.
  const count = results?.totalAll ?? 0;

  return {
    mainRef,
    results: isSuccess && count > 0 ? results : null,
    genre: search.genre,
    isIdle: search.isIdle,
    isLoading,
    // Paging keeps the previous page on screen without isLoading: busy covers that wait too.
    isBusy: search.isFetching,
    hasError: isError,
    isEmpty: isSuccess && count === 0,
    emptyTitle: formatEmptyTitle(term),
    announcement: getAnnouncement({ term, count, isLoading, isError, isSuccess }),
    // Retry swaps the message for the skeleton: the focused button goes, focus moves to <main>.
    onRetry: (): void => {
      mainRef.current?.focus();
      void search.refetch();
    },
    onGenreChange: search.selectGenre,
    onPageChange: search.changePage,
  };
}
