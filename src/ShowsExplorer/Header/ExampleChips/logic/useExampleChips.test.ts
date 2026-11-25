import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useExampleChips } from './useExampleChips';

describe('useExampleChips', () => {
  it('searches the example and keeps focus in the search field', () => {
    const onSelect = vi.fn();
    const focus = vi.fn();
    const inputRef = { current: { focus } as unknown as HTMLInputElement };

    const { result } = renderHook(() => useExampleChips({ onSelect, inputRef }));
    result.current.chips.find((chip) => chip.label === 'Batman')?.onClick?.();

    expect(onSelect).toHaveBeenCalledWith('Batman');
    expect(focus).toHaveBeenCalledOnce();
  });

  it('gives the chips plain-button semantics and a group label id', () => {
    const { result } = renderHook(() =>
      useExampleChips({ onSelect: vi.fn(), inputRef: { current: null } }),
    );

    expect(result.current.labelId).not.toBe('');
    expect(result.current.chips.every((chip) => chip.isActive === undefined)).toBe(true);
  });
});
