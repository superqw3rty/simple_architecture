import { describe, expect, it } from 'vitest';
import { stripHtml } from './stripHtml.ts';

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
