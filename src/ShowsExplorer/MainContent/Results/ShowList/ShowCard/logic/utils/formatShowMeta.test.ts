import { describe, expect, it } from 'vitest';
import type { Show } from '@/types/show';
import { formatShowMeta } from './formatShowMeta';

const show = (fields: Partial<Show>): Show => ({
  id: 1,
  name: 'Murder',
  genres: [],
  imageUrl: null,
  rating: null,
  year: 2015,
  language: 'English',
  status: 'Ended',
  summary: '',
  ...fields,
});

describe('formatShowMeta', () => {
  it('joins year, language and status', () => {
    expect(formatShowMeta(show({}))).toBe('2015 · English · Ended');
  });

  it('skips unknown parts without leaving a separator', () => {
    expect(formatShowMeta(show({ year: null }))).toBe('English · Ended');
    expect(formatShowMeta(show({ language: null }))).toBe('2015 · Ended');
    expect(formatShowMeta(show({ status: null }))).toBe('2015 · English');
  });

  it('returns an empty string when nothing is known', () => {
    expect(formatShowMeta(show({ year: null, language: null, status: null }))).toBe('');
  });
});
