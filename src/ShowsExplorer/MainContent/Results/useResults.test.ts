import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Show } from '@/types/show';
import { formatPageRange } from './utils/formatPageRange';
import { formatResultsTitle } from '../utils/formatResultsTitle';
import { useResults } from './useResults';

const show = (id: number, genre: string): Show => ({
  id,
  name: `Show ${id}`,
  genres: [genre],
  imageUrl: null,
  rating: null,
  year: null,
  language: null,
  status: null,
  summary: '',
});

// 7 shows: 2 comedies and 5 dramas, that is 3 pages of 3.
const SHOWS = [1, 2, 3, 4, 5, 6, 7].map((id) => show(id, id <= 2 ? 'Comedy' : 'Drama'));

const renderResults = (): RenderHookResult<ReturnType<typeof useResults>, unknown> =>
  renderHook(() => useResults({ term: 'murder', shows: SHOWS }));

const clickChip = (chips: { label: string; onClick?: () => void }[], label: string): void =>
  act(() => chips.find((chip) => chip.label === label)?.onClick?.());

describe('useResults', () => {
  it('shows the first page and the total count', () => {
    const { result } = renderResults();

    expect(result.current.title).toBe('7 shows for “murder”');
    expect(result.current.visibleShows.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(result.current).toMatchObject({ page: 1, totalPages: 3 });
  });

  it('filters by genre and goes back to the first page', () => {
    const { result } = renderResults();

    act(() => result.current.onPageChange(3));
    clickChip(result.current.chips, 'Comedy');

    expect(result.current.title).toBe('2 shows for “murder”');
    expect(result.current.visibleShows.map((item) => item.id)).toEqual([1, 2]);
    expect(result.current).toMatchObject({ page: 1, totalPages: 1 });
  });

  it('moves focus to the heading on a page change and keeps the handler stable', () => {
    const { result, rerender } = renderResults();
    const focus = vi.fn();
    result.current.headingRef.current = { focus } as unknown as HTMLHeadingElement;
    const { onPageChange } = result.current;

    act(() => onPageChange(2));
    rerender();

    expect(focus).toHaveBeenCalledOnce();
    expect(result.current.page).toBe(2);
    expect(result.current.onPageChange).toBe(onPageChange);
  });

  it('drops the filter on a second click on the active genre', () => {
    const { result } = renderResults();

    clickChip(result.current.chips, 'Comedy');
    clickChip(result.current.chips, 'Comedy');

    expect(result.current.totalPages).toBe(3);
  });
});

describe('formatResultsTitle', () => {
  it('uses the singular for one show', () => {
    expect(formatResultsTitle(1, 'kill')).toBe('1 show for “kill”');
  });
});

describe('formatPageRange', () => {
  it('names the items of the current page', () => {
    expect(formatPageRange(1, 3, 10)).toBe('Showing 1–3 of 10');
    expect(formatPageRange(4, 3, 10)).toBe('Showing 10–10 of 10');
  });
});
