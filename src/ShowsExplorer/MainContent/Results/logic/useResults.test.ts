import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ShowListItem, ShowsPage } from '@/types/show';
import { formatPageRange } from './utils/formatPageRange';
import { formatResultsTitle } from '@/ShowsExplorer/MainContent/logic/utils/formatResultsTitle';
import type { ResultsProps } from '../Results';
import { useResults } from './useResults';

const show = (id: number): ShowListItem => ({
  id,
  name: `Show ${id}`,
  genres: ['Drama'],
  imageUrl: null,
  rating: null,
  year: null,
  language: null,
  status: null,
  summary: '',
  isFavorite: false,
});

// Page 2 of the Drama filter: 5 dramas of 7 shows, 3 per page.
const RESULTS: ShowsPage = {
  items: [show(6), show(7)],
  page: 2,
  totalPages: 2,
  total: 5,
  pageSize: 3,
  genres: [
    { name: 'Drama', count: 5 },
    { name: 'Comedy', count: 2 },
  ],
  totalAll: 7,
};

type Rendered = RenderHookResult<ReturnType<typeof useResults>, ResultsProps>;

const renderResults = (overrides: Partial<ResultsProps> = {}): Rendered =>
  renderHook((props) => useResults(props), {
    initialProps: {
      term: 'murder',
      results: RESULTS,
      genre: 'Drama',
      onGenreChange: vi.fn(),
      onPageChange: vi.fn(),
      ...overrides,
    },
  });

describe('useResults', () => {
  it('words the page the server sent', () => {
    const { result } = renderResults();

    expect(result.current).toMatchObject({
      title: '5 shows for “murder”',
      page: 2,
      totalPages: 2,
      pageCaption: 'Showing 4–5 of 5',
    });
    expect(result.current.shows.map((item) => item.id)).toEqual([6, 7]);
  });

  it('builds chips from the server genres, "All" counts the whole search', () => {
    const onGenreChange = vi.fn();
    const { result } = renderResults({ onGenreChange });

    expect(result.current.hasGenres).toBe(true);
    expect(
      result.current.chips.map(({ label, count, isActive }) => [label, count, isActive]),
    ).toEqual([
      ['All', 7, false],
      ['Drama', 5, true],
      ['Comedy', 2, false],
    ]);

    act(() => result.current.chips.find((chip) => chip.label === 'Comedy')?.onClick?.());
    expect(onGenreChange).toHaveBeenCalledWith('Comedy');
  });

  it('has no chips when the search has no genres', () => {
    const { result } = renderResults({ results: { ...RESULTS, genres: [] } });

    expect(result.current).toMatchObject({ hasGenres: false, chips: [] });
  });

  it('asks for the page, moves focus to the heading and keeps the handler stable', () => {
    const props: ResultsProps = {
      term: 'murder',
      results: RESULTS,
      genre: 'Drama',
      onGenreChange: vi.fn(),
      onPageChange: vi.fn(),
    };
    const { result, rerender } = renderResults(props);
    const focus = vi.fn();
    result.current.headingRef.current = { focus } as unknown as HTMLHeadingElement;
    const handler = result.current.onPageChange;

    act(() => handler(1));
    rerender({ ...props, results: { ...RESULTS, page: 1 } });

    const { onPageChange } = props;

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(focus).toHaveBeenCalledOnce();
    expect(result.current.onPageChange).toBe(handler);
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
