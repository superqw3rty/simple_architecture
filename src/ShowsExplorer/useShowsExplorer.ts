import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { SEARCH_DEBOUNCE_MS } from './constants';

/**
 * Owns the search field and decides the layout.
 *
 * - `term` is the trimmed query once typing pauses: it is what gets searched.
 * - The layout follows `term`, not `query`: the header collapses once, when the search goes out,
 *   so the page never sits empty while the user is still typing.
 * - Clearing the field returns to the start screen at once: there is nothing to wait for.
 */
export function useShowsExplorer() {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  // No delay for an empty field, so typing again right after clearing does not bring back the old term.
  const debounced = useDebouncedValue(trimmed, trimmed ? SEARCH_DEBOUNCE_MS : 0);
  const term = trimmed ? debounced : '';

  return {
    isCompact: term.length > 0,
    query,
    term,
    onQueryChange: setQuery,
  };
}
