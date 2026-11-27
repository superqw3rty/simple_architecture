import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import type { ShowsPage } from '@/types/show';
import { useShowsSearch } from './useShowsSearch';

// Our API answers with the page it was asked for; the term goes into the total to tell searches apart.
const pageFor = (url: string): ShowsPage => {
  const params = new URL(url, 'http://test').searchParams;
  return {
    items: [],
    page: Number(params.get('page')),
    totalPages: 4,
    total: params.get('genre') ? 1 : 10,
    pageSize: 3,
    genres: [{ name: 'Crime', count: 9 }],
    totalAll: params.get('q') === 'murder' ? 10 : 7,
  };
};

const stubFetch = (): Mock<typeof fetch> => {
  const mock = vi.fn<typeof fetch>((input) =>
    Promise.resolve(Response.json(pageFor(String(input)))),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
};

const lastUrl = (mock: Mock<typeof fetch>): string => String(mock.mock.lastCall?.[0]);

// Holds the next answer until release(), so the state while a request is in flight can be checked.
function holdAnswers(mock: Mock<typeof fetch>): () => void {
  let answer = (): void => {};
  mock.mockImplementation(
    (input) =>
      new Promise((resolve) => {
        answer = (): void => resolve(Response.json(pageFor(String(input))));
      }),
  );
  return () => act(() => answer());
}

type Rendered = RenderHookResult<ReturnType<typeof useShowsSearch>, { term: string }>;

function renderSearch(term: string): Rendered {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook((props) => useShowsSearch(props.term), { wrapper, initialProps: { term } });
}

describe('useShowsSearch', () => {
  it('stays idle and sends nothing for an empty term', () => {
    const mock = stubFetch();

    const { result } = renderSearch('');

    expect(result.current).toMatchObject({ results: null, isIdle: true, isLoading: false });
    expect(mock).not.toHaveBeenCalled();
  });

  it('loads the first page of all genres for the term', async () => {
    const mock = stubFetch();

    const { result } = renderSearch('murder');

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.results).toMatchObject({ page: 1, totalAll: 10 });
    expect(lastUrl(mock)).toBe('/api/shows?q=murder&page=1');
  });

  it('keeps the previous page on screen while the next one loads', async () => {
    const mock = stubFetch();
    const { result } = renderSearch('murder');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const release = holdAnswers(mock);
    act(() => result.current.changePage(2));

    await waitFor(() => expect(result.current.isFetching).toBe(true));
    expect(result.current).toMatchObject({ isLoading: false, results: { page: 1 } });

    release();
    await waitFor(() => expect(result.current.results?.page).toBe(2));
    expect(lastUrl(mock)).toBe('/api/shows?q=murder&page=2');
  });

  it('asks for the first page of a picked genre', async () => {
    const mock = stubFetch();
    const { result } = renderSearch('murder');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => result.current.changePage(3));
    act(() => result.current.selectGenre('Crime'));

    await waitFor(() => expect(result.current.results?.total).toBe(1));
    expect(result.current.genre).toBe('Crime');
    expect(lastUrl(mock)).toBe('/api/shows?q=murder&genre=Crime&page=1');
  });

  it('starts a new term from all genres and page 1, without the old results', async () => {
    const mock = stubFetch();
    const { result, rerender } = renderSearch('murder');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => result.current.selectGenre('Crime'));
    await waitFor(() => expect(result.current.results?.total).toBe(1));

    rerender({ term: 'batman' });

    expect(result.current).toMatchObject({ genre: null, results: null, isLoading: true });
    await waitFor(() => expect(result.current.results?.totalAll).toBe(7));
    expect(lastUrl(mock)).toBe('/api/shows?q=batman&page=1');
  });

  it('keeps the handlers stable while the term stays the same', async () => {
    stubFetch();
    const { result, rerender } = renderSearch('murder');
    const { selectGenre, changePage } = result.current;
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ term: 'murder' });

    expect(result.current.selectGenre).toBe(selectGenre);
    expect(result.current.changePage).toBe(changePage);
  });

  it('reports a failed search, and goes back to loading, not error, while a retry runs', async () => {
    const mock = vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 500 })));
    vi.stubGlobal('fetch', mock);
    const { result } = renderSearch('murder');
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.results).toBeNull();

    const release = holdAnswers(mock);
    act(() => void result.current.refetch());

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.isError).toBe(false);

    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
