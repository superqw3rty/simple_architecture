export type PageItem = number | 'ellipsis';

/** Up to this many pages are listed in full, without gaps. */
const MAX_PLAIN_PAGES = 7;
/** How many neighbours of the current page stay visible on each side. */
const SIBLINGS = 1;

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);

/**
 * Which page buttons to show: always the first, the last, the current page and its neighbours.
 * Everything else collapses into an ellipsis: 1 … 4 5 6 … 12
 */
export function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_PLAIN_PAGES) {
    return range(1, totalPages);
  }

  const start = Math.max(2, page - SIBLINGS);
  const end = Math.min(totalPages - 1, page + SIBLINGS);
  const items: PageItem[] = [1];

  if (start > 2) {
    items.push('ellipsis');
  }
  items.push(...range(start, end));
  if (end < totalPages - 1) {
    items.push('ellipsis');
  }
  items.push(totalPages);

  return items;
}
