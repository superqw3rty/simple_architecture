import { formatResultsTitle } from './components/Results';
import { ERROR_DESCRIPTION, ERROR_TITLE } from './components/ErrorComponent';
import { formatEmptyTitle } from './formatEmptyTitle';

interface SearchState {
  term: string;
  count: number;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

/**
 * The sentence a screen reader hears when the search state changes.
 * One short line instead of the whole list: the user moves into the results on their own.
 */
export function getAnnouncement({ term, count, isLoading, isError, isSuccess }: SearchState) {
  if (isLoading) {
    return `Searching for “${term}”…`;
  }
  if (isError) {
    return `${ERROR_TITLE}. ${ERROR_DESCRIPTION}`;
  }
  if (!isSuccess) {
    return '';
  }
  return count > 0 ? formatResultsTitle(count, term) : formatEmptyTitle(term);
}
