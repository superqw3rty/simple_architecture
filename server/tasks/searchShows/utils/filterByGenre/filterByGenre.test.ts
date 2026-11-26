import { describe, expect, it } from 'vitest';
import type { Show } from '#shared';
import { filterByGenre } from './filterByGenre.ts';

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

describe('filterByGenre', () => {
  const shows = [show(1, ['Comedy']), show(2, ['Drama', 'Comedy']), show(3, [])];

  it('keeps every show, including ones without genres, when no genre is picked', () => {
    expect(filterByGenre(shows, null)).toBe(shows);
  });

  it('keeps only the shows of the picked genre', () => {
    expect(filterByGenre(shows, 'Comedy').map((item) => item.id)).toEqual([1, 2]);
    expect(filterByGenre(shows, 'Horror')).toEqual([]);
  });
});
