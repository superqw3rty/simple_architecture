// API contract: GET /api/shows?q=&genre=&page=
import type { Show } from './show.ts';

/** A show in search results, marked for the client that sent X-Client-Id. */
export interface ShowListItem extends Show {
  isFavorite: boolean;
}

/** A genre chip: how many shows of the whole search have this genre. */
export interface GenreCount {
  name: string;
  count: number;
}

export interface ShowsPage {
  items: ShowListItem[];
  /** 1-based, already normalized by the server. */
  page: number;
  totalPages: number;
  /** Shows after the genre filter. */
  total: number;
  pageSize: number;
  /** Counted over the whole search, before the genre filter. */
  genres: GenreCount[];
  /** Shows before the genre filter. */
  totalAll: number;
}
