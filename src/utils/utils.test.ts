import { describe, expect, it } from 'vitest';
import { paginate } from './paginate';
import { stripHtml } from './stripHtml';
import { uniqueSorted } from './uniqueSorted';

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  it('returns the requested page', () => {
    expect(paginate(items, 2, 3)).toEqual({ items: [4, 5, 6], page: 2, totalPages: 3 });
  });

  it('clamps an out-of-range page', () => {
    expect(paginate(items, 99, 3)).toEqual({ items: [7], page: 3, totalPages: 3 });
    expect(paginate(items, 0, 3).page).toBe(1);
  });

  it('reports one empty page for an empty list', () => {
    expect(paginate([], 1, 3)).toEqual({ items: [], page: 1, totalPages: 1 });
  });
});

describe('stripHtml', () => {
  it('removes tags and decodes common entities', () => {
    expect(stripHtml('<p><b>Tom &amp; Jerry</b></p><p>A&nbsp;classic.</p>')).toBe(
      'Tom & Jerry A classic.',
    );
  });

  it('handles missing values', () => {
    expect(stripHtml(null)).toBe('');
  });
});

describe('uniqueSorted', () => {
  it('deduplicates and sorts', () => {
    expect(uniqueSorted(['Drama', 'Comedy', 'Drama'])).toEqual(['Comedy', 'Drama']);
  });
});
