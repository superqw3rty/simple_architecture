import { describe, expect, it } from 'vitest';
import { formatResultsTitle } from './formatResultsTitle';

describe('formatResultsTitle', () => {
  it('uses the singular for one show and the plural otherwise', () => {
    expect(formatResultsTitle(1, 'murder')).toBe('1 show for “murder”');
    expect(formatResultsTitle(2, 'murder')).toBe('2 shows for “murder”');
    expect(formatResultsTitle(0, 'murder')).toBe('0 shows for “murder”');
  });
});
