import { useCallback, useRef, type RefObject } from 'react';
import type { ChipProps } from '@/components/ui/Chip';
import type { Show } from '@/types/show';
import type { ResultsProps } from '../Results';
import { formatPageRange } from './utils/formatPageRange';
import { formatResultsTitle } from '@/ShowsExplorer/MainContent/logic/utils/formatResultsTitle';
import { getGenreChips } from './utils/getGenreChips';

interface UseResultsResult {
  title: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  hasGenres: boolean;
  chips: ChipProps[];
  shows: Show[];
  page: number;
  totalPages: number;
  pageCaption: string;
  onPageChange: (page: number) => void;
}

// The server already filtered and paged the results: this presenter only words them for the view.
export function useResults({
  term,
  results,
  genre,
  onGenreChange,
  onPageChange,
}: ResultsProps): UseResultsResult {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const chips = getGenreChips(results.genres, results.totalAll, genre, onGenreChange);

  // Focus to the heading first: a ‹ › button that turns disabled would drop it to <body>.
  const changePage = useCallback(
    (next: number): void => {
      onPageChange(next);
      headingRef.current?.focus();
    },
    [onPageChange],
  );

  return {
    title: formatResultsTitle(results.total, term),
    headingRef,
    hasGenres: chips.length > 0,
    chips,
    shows: results.items,
    // The server clamps the page, so the response, not the request, says which one this is.
    page: results.page,
    totalPages: results.totalPages,
    pageCaption: formatPageRange(results.page, results.pageSize, results.total),
    onPageChange: changePage,
  };
}
