import { useMemo } from 'react';
import { getPageItems, type PageItem } from './getPageItems';
import type { PaginationProps } from './Pagination';

const toViewItem = (item: PageItem, index: number, page: number, goTo: (p: number) => void) => {
  if (item === 'ellipsis') {
    return {
      key: `ellipsis-${index}`,
      isEllipsis: true,
      label: '…',
      ariaLabel: '',
      isCurrent: false,
      onClick: undefined,
    };
  }

  return {
    key: String(item),
    isEllipsis: false,
    label: String(item),
    ariaLabel: `Page ${item}`,
    isCurrent: item === page,
    onClick: () => goTo(item),
  };
};

export function usePagination({ page, totalPages, onChange }: PaginationProps) {
  const items = useMemo(
    () =>
      getPageItems(page, totalPages).map((item, index) => toViewItem(item, index, page, onChange)),
    [page, totalPages, onChange],
  );

  return {
    isHidden: totalPages <= 1,
    items,
    previous: { isDisabled: page <= 1, onClick: () => onChange(page - 1) },
    next: { isDisabled: page >= totalPages, onClick: () => onChange(page + 1) },
  };
}
