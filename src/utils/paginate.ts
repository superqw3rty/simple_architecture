export interface Page<T> {
  items: T[];
  /** 1-based, always within [1, totalPages]. */
  page: number;
  totalPages: number;
}

/** Slices one page out of the list. An out-of-range page is clamped, so callers need no sync effects. */
export function paginate<T>(items: readonly T[], page: number = 1, pageSize: number = 3): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  const start = (current - 1) * pageSize;

  return { items: items.slice(start, start + pageSize), page: current, totalPages };
}
