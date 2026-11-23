import { useState } from 'react';
import type { Show } from '@/types/show';
import { getGenreChips } from './getGenreChips';

const filterByGenre = (shows: Show[], genre: string | null): Show[] =>
  genre === null ? shows : shows.filter((show) => show.genres.includes(genre));

/** One selected genre or none. `onChange` runs on every selection, e.g. to reset the page. */
export function useGenreFilter(shows: Show[], onChange: () => void) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const selectGenre = (genre: string | null) => {
    setSelectedGenre(genre);
    onChange();
  };

  return {
    chips: getGenreChips(shows, selectedGenre, selectGenre),
    filteredShows: filterByGenre(shows, selectedGenre),
  };
}
