import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { useShowsSearch } from './useShowsSearch';

const stubFetch = (response: () => Response): Mock<typeof fetch> => {
  const mock = vi.fn<typeof fetch>(() => Promise.resolve(response()));
  vi.stubGlobal('fetch', mock);
  return mock;
};

const MURDER = [{ score: 1, show: { id: 1, name: 'Murder', genres: ['Crime'] } }];

function renderSearch(term: string): RenderHookResult<ReturnType<typeof useShowsSearch>, unknown> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useShowsSearch(term), { wrapper });
}

describe('useShowsSearch', () => {
  it('stays idle and sends nothing for an empty term', () => {
    const mock = stubFetch(() => Response.json([]));

    const { result } = renderSearch('');

    expect(result.current).toMatchObject({ shows: [], isIdle: true, isLoading: false });
    expect(mock).not.toHaveBeenCalled();
  });

  it('loads mapped shows for the term', async () => {
    const mock = stubFetch(() => Response.json(MURDER));

    const { result } = renderSearch('murder');

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.shows).toEqual([expect.objectContaining({ id: 1, name: 'Murder' })]);
    expect(mock.mock.calls[0]?.[0]).toBe('https://api.tvmaze.com/search/shows?q=murder');
  });

  it('reports a failed search with no shows', async () => {
    stubFetch(() => new Response(null, { status: 500 }));

    const { result } = renderSearch('murder');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.shows).toEqual([]);
  });

  it('goes back to loading, not error, while a retry runs', async () => {
    const mock = stubFetch(() => new Response(null, { status: 500 }));
    const { result } = renderSearch('murder');
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Hold the answer, so the state during the retry can be checked.
    let answer: (response: Response) => void = () => {};
    mock.mockImplementation(() => new Promise<Response>((resolve) => (answer = resolve)));
    act(() => void result.current.refetch());

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.isError).toBe(false);

    answer(Response.json(MURDER));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
