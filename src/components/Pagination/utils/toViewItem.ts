import type { PageItem } from './getPageItems';

export interface PageViewItem {
  key: string;
  isEllipsis: boolean;
  label: string;
  ariaLabel: string;
  isCurrent: boolean;
  onClick: (() => void) | undefined;
}

export function toViewItem(
  item: PageItem,
  index: number,
  page: number,
  goTo: (page: number) => void,
): PageViewItem {
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
}
