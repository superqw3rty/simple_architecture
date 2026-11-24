import { useMemo } from 'react';
import { getPageItems } from './utils/getPageItems';
import { toViewItem, type PageViewItem } from './utils/toViewItem';
import type { PaginationProps } from './Pagination';

interface PageStepButton {
  isDisabled: boolean;
  onClick: () => void;
}

interface UsePaginationResult {
  isHidden: boolean;
  hasCaption: boolean;
  items: PageViewItem[];
  previous: PageStepButton;
  next: PageStepButton;
}

export function usePagination({
  page,
  totalPages,
  caption,
  onChange,
}: PaginationProps): UsePaginationResult {
  const items = useMemo(
    () =>
      getPageItems(page, totalPages).map((item, index) => toViewItem(item, index, page, onChange)),
    [page, totalPages, onChange],
  );

  return {
    isHidden: totalPages <= 1,
    hasCaption: Boolean(caption),
    items,
    previous: { isDisabled: page <= 1, onClick: () => onChange(page - 1) },
    next: { isDisabled: page >= totalPages, onClick: () => onChange(page + 1) },
  };
}
