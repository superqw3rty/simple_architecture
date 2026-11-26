// API contract: /api/favorites
import type { Show } from './show.ts';

/** GET /api/favorites */
export interface FavoritesList {
  items: Show[];
  count: number;
}

/** PUT and DELETE /api/favorites/:id */
export interface FavoriteStatus {
  isFavorite: boolean;
  count: number;
}
