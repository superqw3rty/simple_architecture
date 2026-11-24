import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SEARCH_DEBOUNCE_MS } from './constants';
import { useShowsExplorer } from './useShowsExplorer';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function type(result: { current: ReturnType<typeof useShowsExplorer> }, query: string): void {
  act(() => result.current.onQueryChange(query));
}

const pause = (ms = SEARCH_DEBOUNCE_MS): void => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('useShowsExplorer', () => {
  it('starts on the full start screen', () => {
    const { result } = renderHook(() => useShowsExplorer());

    expect(result.current).toMatchObject({ query: '', term: '', isCompact: false });
  });

  it('keeps the layout while typing and switches once typing pauses', () => {
    const { result } = renderHook(() => useShowsExplorer());

    for (const query of ['k', 'ki', 'kil', ' kill ']) {
      type(result, query);
    }
    pause(SEARCH_DEBOUNCE_MS - 1);
    expect(result.current).toMatchObject({ query: ' kill ', term: '', isCompact: false });

    pause(1);
    expect(result.current).toMatchObject({ term: 'kill', isCompact: true });
  });

  it('returns to the start screen at once when the field is cleared', () => {
    const { result } = renderHook(() => useShowsExplorer());
    type(result, 'murder');
    pause();

    type(result, '  ');

    expect(result.current).toMatchObject({ term: '', isCompact: false });
  });

  it('does not bring back the old term when typing again right after clearing', () => {
    const { result } = renderHook(() => useShowsExplorer());
    type(result, 'murder');
    pause();
    type(result, '');
    pause(0);

    type(result, 'k');

    expect(result.current).toMatchObject({ term: '', isCompact: false });
  });
});
