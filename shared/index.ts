// The API contract between server/ and src/. Both import it as '#shared' ("imports" in package.json, D-63).
export type { ApiErrorBody } from './error.ts';
export type { FavoritesList, FavoriteStatus } from './favorites.ts';
export type { GenreCount, ShowListItem, ShowsPage } from './shows.ts';
export type { Show, ShowStatus } from './show.ts';
