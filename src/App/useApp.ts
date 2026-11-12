import { useState, type ChangeEvent } from 'react';

const GENRES = [
  { label: 'Comedy', count: 2 },
  { label: 'Crime', count: 6 },
  { label: 'Drama', count: 5 },
  { label: 'Mystery', count: 4 },
];
const TOTAL_PAGES = 12;

/** Demo state for the showcase. Goes away together with the showcase in stage 2. */
export function useApp() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const chips = [
    { label: 'All', count: 10, isActive: genre === null, onSelect: () => setGenre(null) },
    ...GENRES.map((item) => ({
      ...item,
      isActive: item.label === genre,
      onSelect: () => setGenre(item.label === genre ? null : item.label),
    })),
  ];

  return {
    query,
    onQueryChange: (event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
    chips,
    page,
    totalPages: TOTAL_PAGES,
    onPageChange: setPage,
    onAction: () => setPage(1),
  };
}
