import { useState } from 'react';
import { paginate } from '@/utils/paginate';
import type { ResultsProps } from './Results';
import { PAGE_SIZE } from './constants';
import { formatPageRange } from './formatPageRange';
import { formatResultsTitle } from './formatResultsTitle';
import { useGenreFilter } from './useGenreFilter';

/**
 * Genre filter + client-side paging over one search result.
 * The parent remounts Results with key={term}, so a new term starts from scratch.
 */
export function useResults({ term, shows }: ResultsProps) {
  const [page, setPage] = useState(1);
  const genres = useGenreFilter(shows, () => setPage(1));
  const total = genres.filteredShows.length;
  const paged = paginate(genres.filteredShows, page, PAGE_SIZE);

  return {
    title: formatResultsTitle(total, term),
    hasGenres: genres.chips.length > 0,
    chips: genres.chips,
    visibleShows: paged.items,
    page: paged.page,
    totalPages: paged.totalPages,
    pageCaption: formatPageRange(paged.page, PAGE_SIZE, total),
    // setState is stable: Pagination's memoized items are not rebuilt on every render.
    onPageChange: setPage,
  };
}
