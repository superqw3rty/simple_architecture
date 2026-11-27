import type { ChipProps } from '@/components/ui/Chip';
import type { GenreCount } from '@/types/show';

// The server counts genres over the whole search and sorts them; "All" goes first with totalAll.
export function getGenreChips(
  genres: readonly GenreCount[],
  totalAll: number,
  selectedGenre: string | null,
  onSelect: (genre: string | null) => void,
): ChipProps[] {
  if (genres.length === 0) {
    return [];
  }

  const allChip: ChipProps = {
    label: 'All',
    count: totalAll,
    isActive: selectedGenre === null,
    onClick: () => onSelect(null),
  };

  const genreChips = genres.map(({ name, count }): ChipProps => {
    const isActive = name === selectedGenre;
    return { label: name, count, isActive, onClick: () => onSelect(isActive ? null : name) };
  });

  return [allChip, ...genreChips];
}
