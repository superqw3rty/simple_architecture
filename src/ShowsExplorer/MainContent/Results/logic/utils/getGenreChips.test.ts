import { describe, expect, it, vi } from 'vitest';
import type { Show } from '@/types/show';
import { countGenres, getGenreChips } from './getGenreChips';

const show = (id: number, genres: string[]): Show => ({
  id,
  name: `Show ${id}`,
  genres,
  imageUrl: null,
  rating: null,
  year: null,
  language: null,
  status: null,
  summary: '',
});

const SHOWS = [show(1, ['Drama', 'Crime']), show(2, ['Comedy']), show(3, ['Drama'])];

describe('countGenres', () => {
  it('puts the most common genres first, ties in alphabetical order', () => {
    expect(countGenres(SHOWS)).toEqual([
      ['Drama', 2],
      ['Comedy', 1],
      ['Crime', 1],
    ]);
  });
});

describe('getGenreChips', () => {
  it('puts "All" with the total count first', () => {
    const chips = getGenreChips(SHOWS, null, vi.fn());

    expect(chips.map(({ label, count, isActive }) => ({ label, count, isActive }))).toEqual([
      { label: 'All', count: 3, isActive: true },
      { label: 'Drama', count: 2, isActive: false },
      { label: 'Comedy', count: 1, isActive: false },
      { label: 'Crime', count: 1, isActive: false },
    ]);
  });

  it('selects a genre, and resets the filter on a click on the active one', () => {
    const onSelect = vi.fn();
    const chips = getGenreChips(SHOWS, 'Drama', onSelect);

    chips.find((chip) => chip.label === 'Comedy')?.onClick?.();
    chips.find((chip) => chip.label === 'Drama')?.onClick?.();
    chips.find((chip) => chip.label === 'All')?.onClick?.();

    expect(onSelect.mock.calls).toEqual([['Comedy'], [null], [null]]);
  });

  it('returns no chips when the results have no genres', () => {
    expect(getGenreChips([show(1, [])], null, vi.fn())).toEqual([]);
  });
});
