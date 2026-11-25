import { useRef, useState, type RefObject } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { SEARCH_DEBOUNCE_MS } from '../constants';

interface UseShowsExplorerResult {
  isCompact: boolean;
  query: string;
  term: string;
  onQueryChange: (query: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function useShowsExplorer(): UseShowsExplorerResult {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, trimmed ? SEARCH_DEBOUNCE_MS : 0);
  const term = trimmed ? debounced : '';

  const inputRef = useRef<HTMLInputElement>(null);

  return {
    isCompact: term.length > 0,
    query,
    term,
    onQueryChange: setQuery,
    inputRef,
  };
}
