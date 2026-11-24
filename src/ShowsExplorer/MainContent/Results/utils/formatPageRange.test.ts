import { describe, expect, it } from 'vitest';
import { formatPageRange } from './formatPageRange';

describe('formatPageRange', () => {
  it('shows the range of a full page', () => {
    expect(formatPageRange(1, 3, 10)).toBe('Showing 1–3 of 10');
  });

  it('stops the range at the total on the last page', () => {
    expect(formatPageRange(4, 3, 10)).toBe('Showing 10–10 of 10');
  });
});
