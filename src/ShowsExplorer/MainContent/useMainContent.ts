import { useRef, type RefObject } from 'react';
import type { Show } from '@/types/show';
import { getAnnouncement } from './utils/getAnnouncement';
import { formatEmptyTitle } from './utils/formatEmptyTitle';
import { useShowsSearch } from './useShowsSearch';

interface UseMainContentResult {
  mainRef: RefObject<HTMLElement | null>;
  shows: Show[];
  isIdle: boolean;
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  hasResults: boolean;
  announcement: string;
  onRetry: () => void;
}

export function useMainContent(term: string): UseMainContentResult {
  const { shows, isIdle, isLoading, isSuccess, isError, refetch } = useShowsSearch(term);
  const mainRef = useRef<HTMLElement>(null);
  const hasShows = shows.length > 0;

  return {
    mainRef,
    shows,
    isIdle,
    isLoading,
    hasError: isError,
    isEmpty: isSuccess && !hasShows,
    emptyTitle: formatEmptyTitle(term),
    hasResults: isSuccess && hasShows,
    announcement: getAnnouncement({ term, count: shows.length, isLoading, isError, isSuccess }),
    // Retry swaps the message for the skeleton: the focused button goes, focus moves to <main>.
    onRetry: (): void => {
      mainRef.current?.focus();
      void refetch();
    },
  };
}
