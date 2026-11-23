import type { ChipProps } from '@/components/ui/Chip';
import type { Show } from '@/types/show';

/** How many shows have each genre. The most common genres first, ties in alphabetical order (Figma). */
export function countGenres(shows: readonly Show[]): [genre: string, count: number][] {
  const counts = new Map<string, number>();
  for (const genre of shows.flatMap((show) => show.genres)) {
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  return [...counts].sort(
    ([genreA, countA], [genreB, countB]) => countB - countA || genreA.localeCompare(genreB),
  );
}

/**
 * Chips of the genre filter: "All" first, then every genre of the results with its count.
 * A click on the active genre resets the filter (hw1). No genres in the results — no chips.
 */
export function getGenreChips(
  shows: readonly Show[],
  selectedGenre: string | null,
  onSelect: (genre: string | null) => void,
): ChipProps[] {
  const genres = countGenres(shows);
  if (genres.length === 0) {
    return [];
  }

  const allChip: ChipProps = {
    label: 'All',
    count: shows.length,
    isActive: selectedGenre === null,
    onClick: () => onSelect(null),
  };

  const genreChips = genres.map(([genre, count]): ChipProps => {
    const isActive = genre === selectedGenre;
    return { label: genre, count, isActive, onClick: () => onSelect(isActive ? null : genre) };
  });

  return [allChip, ...genreChips];
}
