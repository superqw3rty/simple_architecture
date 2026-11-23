import { getAnnouncement } from './getAnnouncement';
import { formatEmptyTitle } from './formatEmptyTitle';
import { useShowsSearch } from './useShowsSearch';

/** Turns the search state into the one screen state MainContent shows. */
export function useMainContent(term: string) {
  const { shows, isIdle, isLoading, isSuccess, isError, refetch } = useShowsSearch(term);
  const hasShows = shows.length > 0;

  return {
    shows,
    isIdle,
    isLoading,
    hasError: isError,
    isEmpty: isSuccess && !hasShows,
    emptyTitle: formatEmptyTitle(term),
    hasResults: isSuccess && hasShows,
    announcement: getAnnouncement({ term, count: shows.length, isLoading, isError, isSuccess }),
    // Wrapped: refetch must not receive the click event as its options.
    onRetry: () => void refetch(),
  };
}
