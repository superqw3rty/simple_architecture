import { useState } from 'react';
import type { ChipProps } from '@/components/ui/Chip';
import type { Show } from '@/types/show';
import { filterByGenre } from '../utils/filterByGenre';
import { getGenreChips } from '../utils/getGenreChips';

interface UseGenreFilterResult {
  chips: ChipProps[];
  filteredShows: Show[];
}

export function useGenreFilter(shows: Show[], onChange: () => void): UseGenreFilterResult {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const selectGenre = (genre: string | null): void => {
    setSelectedGenre(genre);
    onChange();
  };

  return {
    chips: getGenreChips(shows, selectedGenre, selectGenre),
    filteredShows: filterByGenre(shows, selectedGenre),
  };
}
