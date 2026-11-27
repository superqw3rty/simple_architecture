import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { queryClient } from '@/api/queryClient';
import { useQueryProvider } from './useQueryProvider';

describe('useQueryProvider', () => {
  it('hands React the same singleton the tasks import', () => {
    const { result, rerender } = renderHook(() => useQueryProvider());
    const first = result.current.client;

    rerender();

    expect(first).toBe(queryClient);
    expect(result.current.client).toBe(queryClient);
  });

  it('gives every mount the same cache', () => {
    const a = renderHook(() => useQueryProvider()).result.current.client;
    const b = renderHook(() => useQueryProvider()).result.current.client;

    expect(a).toBe(b);
  });
});
