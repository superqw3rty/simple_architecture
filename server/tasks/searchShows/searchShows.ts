import type { ShowListItem, ShowsPage } from '#shared';
import { mapShow } from '#server/tvmaze/mapShow.ts';
import type { TvMazeSearchResponse } from '#server/tvmaze/types.ts';
import { fetchWithCache } from '../fetchWithCache/index.ts';
import { countGenres } from './utils/countGenres/index.ts';
import { filterByGenre } from './utils/filterByGenre/index.ts';
import { paginate } from './utils/paginate/index.ts';

const PAGE_SIZE = 3;

// Already validated by the route: term is non-empty, page is a number.
export interface SearchShowsQuery {
  term: string;
  genre?: string | null;
  page?: number;
}

export async function searchShows({
  term,
  genre = null,
  page = 1,
}: SearchShowsQuery): Promise<ShowsPage> {
  const results = await fetchWithCache<TvMazeSearchResponse>(
    `/search/shows?q=${encodeURIComponent(term)}`,
  );
  const shows = results.map((result) => mapShow(result.show));
  const filtered = filterByGenre(shows, genre);
  const current = paginate(filtered, page, PAGE_SIZE);

  return {
    items: current.items.map((show): ShowListItem => ({ ...show, isFavorite: false })),
    page: current.page,
    totalPages: current.totalPages,
    total: filtered.length,
    pageSize: PAGE_SIZE,
    genres: countGenres(shows),
    totalAll: shows.length,
  };
}
