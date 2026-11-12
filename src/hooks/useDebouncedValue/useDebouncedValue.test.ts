import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('updates only after the value has been stable for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'k' },
    });

    rerender({ value: 'ki' });
    act(() => vi.advanceTimersByTime(300));
    rerender({ value: 'kil' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('k');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('kil');
  });
});
