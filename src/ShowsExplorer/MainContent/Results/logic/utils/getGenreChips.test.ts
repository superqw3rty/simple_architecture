import { describe, expect, it, vi } from 'vitest';
import { getGenreChips } from './getGenreChips';

const GENRES = [
  { name: 'Drama', count: 2 },
  { name: 'Comedy', count: 1 },
  { name: 'Crime', count: 1 },
];

describe('getGenreChips', () => {
  it('puts "All" with the whole search first, then the genres in the server order', () => {
    const chips = getGenreChips(GENRES, 3, null, vi.fn());

    expect(chips.map(({ label, count, isActive }) => ({ label, count, isActive }))).toEqual([
      { label: 'All', count: 3, isActive: true },
      { label: 'Drama', count: 2, isActive: false },
      { label: 'Comedy', count: 1, isActive: false },
      { label: 'Crime', count: 1, isActive: false },
    ]);
  });

  it('selects a genre, and resets the filter on a click on the active one', () => {
    const onSelect = vi.fn();
    const chips = getGenreChips(GENRES, 3, 'Drama', onSelect);

    chips.find((chip) => chip.label === 'Comedy')?.onClick?.();
    chips.find((chip) => chip.label === 'Drama')?.onClick?.();
    chips.find((chip) => chip.label === 'All')?.onClick?.();

    expect(onSelect.mock.calls).toEqual([['Comedy'], [null], [null]]);
  });

  it('returns no chips when the results have no genres', () => {
    expect(getGenreChips([], 1, null, vi.fn())).toEqual([]);
  });
});
