import { describe, expect, it, vi } from 'vitest';
import { toViewItem } from './toViewItem';

describe('toViewItem', () => {
  it('turns a page number into a labelled button that goes to that page', () => {
    const goTo = vi.fn<(page: number) => void>();
    const item = toViewItem(4, 3, 4, goTo);

    expect(item).toMatchObject({
      key: '4',
      isEllipsis: false,
      label: '4',
      ariaLabel: 'Page 4',
      isCurrent: true,
    });
    item.onClick?.();
    expect(goTo).toHaveBeenCalledWith(4);
  });

  it('marks only the current page as current', () => {
    expect(toViewItem(2, 1, 4, vi.fn()).isCurrent).toBe(false);
  });

  it('turns an ellipsis into a non-clickable item with a key unique by position', () => {
    const first = toViewItem('ellipsis', 1, 5, vi.fn());
    const second = toViewItem('ellipsis', 5, 5, vi.fn());

    expect(first).toMatchObject({ isEllipsis: true, label: '…', onClick: undefined });
    expect(first.key).not.toBe(second.key);
  });
});
