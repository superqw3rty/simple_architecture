import { describe, expect, it } from 'vitest';
import { formatEmptyTitle } from './formatEmptyTitle';

describe('formatEmptyTitle', () => {
  it('quotes the search term', () => {
    expect(formatEmptyTitle('qwertyzxcv')).toBe('No shows for “qwertyzxcv”');
  });
});
