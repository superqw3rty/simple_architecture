import type { Show } from '#shared';

export function filterByGenre(shows: Show[], genre: string | null): Show[] {
  return genre === null ? shows : shows.filter((show) => show.genres.includes(genre));
}
