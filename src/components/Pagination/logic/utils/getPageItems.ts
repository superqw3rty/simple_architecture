export type PageItem = number | 'ellipsis';

const MAX_PLAIN_PAGES = 7;
const SIBLINGS = 1;

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);

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
