import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Show } from '@/types/show';
import { useShowCard } from './useShowCard';

const show: Show = {
  id: 1,
  name: 'Murder',
  genres: ['Crime'],
  imageUrl: null,
  rating: 8,
  year: 2014,
  language: 'English',
  status: 'Ended',
  summary: 'A detective story.',
};

describe('useShowCard', () => {
  it('shows every part that has content', () => {
    const { result } = renderHook(() => useShowCard({ show }));

    expect(result.current).toMatchObject({ hasMeta: true, hasGenres: true, hasSummary: true });
  });

  it('hides the genre list and the summary when they are empty', () => {
    const { result } = renderHook(() =>
      useShowCard({ show: { ...show, genres: [], summary: '' } }),
    );

    expect(result.current).toMatchObject({ hasGenres: false, hasSummary: false });
  });

  it('titles a show without a name as Untitled', () => {
    expect(renderHook(() => useShowCard({ show })).result.current.title).toBe('Murder');
    expect(
      renderHook(() => useShowCard({ show: { ...show, name: '' } })).result.current.title,
    ).toBe('Untitled');
  });
});
