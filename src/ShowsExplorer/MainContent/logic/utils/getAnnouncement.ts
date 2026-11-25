import { ERROR_DESCRIPTION, ERROR_TITLE } from '@/ShowsExplorer/MainContent/constants';
import { formatResultsTitle } from './formatResultsTitle';
import { formatEmptyTitle } from './formatEmptyTitle';

interface SearchState {
  term: string;
  count: number;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

export function getAnnouncement({
  term,
  count,
  isLoading,
  isError,
  isSuccess,
}: SearchState): string {
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
