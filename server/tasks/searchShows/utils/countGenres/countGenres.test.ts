import { describe, expect, it } from 'vitest';
import type { Show } from '#shared';
import { countGenres } from './countGenres.ts';

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

describe('countGenres', () => {
  it('puts the most common genres first, ties in alphabetical order', () => {
    const shows = [show(1, ['Drama', 'Crime']), show(2, ['Drama', 'Comedy']), show(3, [])];

    expect(countGenres(shows)).toEqual([
      { name: 'Drama', count: 2 },
      { name: 'Comedy', count: 1 },
      { name: 'Crime', count: 1 },
    ]);
  });

  it('returns nothing for shows without genres', () => {
    expect(countGenres([show(1, [])])).toEqual([]);
  });
});
