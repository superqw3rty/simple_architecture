import { useCallback, useRef, useState, type RefObject } from 'react';
import type { ChipProps } from '@/components/ui/Chip';
import type { Show } from '@/types/show';
import { paginate } from '@/utils/paginate';
import type { ResultsProps } from './Results';
import { PAGE_SIZE } from './constants';
import { formatPageRange } from './utils/formatPageRange';
import { formatResultsTitle } from '../utils/formatResultsTitle';
import { useGenreFilter } from './useGenreFilter';

interface UseResultsResult {
  title: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  hasGenres: boolean;
  chips: ChipProps[];
  visibleShows: Show[];
  page: number;
  totalPages: number;
  pageCaption: string;
  onPageChange: (page: number) => void;
}

export function useResults({ term, shows }: ResultsProps): UseResultsResult {
  const [page, setPage] = useState(1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const genres = useGenreFilter(shows, () => setPage(1));
  const total = genres.filteredShows.length;
  const paged = paginate(genres.filteredShows, page, PAGE_SIZE);

  // Focus to the heading first: a ‹ › button that turns disabled would drop it to <body>.
  const onPageChange = useCallback((next: number): void => {
    setPage(next);
    headingRef.current?.focus();
  }, []);

  return {
    title: formatResultsTitle(total, term),
    headingRef,
    hasGenres: genres.chips.length > 0,
    chips: genres.chips,
    visibleShows: paged.items,
    page: paged.page,
    totalPages: paged.totalPages,
    pageCaption: formatPageRange(paged.page, PAGE_SIZE, total),
    onPageChange,
  };
}
