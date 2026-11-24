import type { ShowCardProps } from './ShowCard';
import { formatShowMeta } from './utils/formatShowMeta';

const UNTITLED = 'Untitled';

interface UseShowCardResult {
  title: string;
  meta: string;
  hasMeta: boolean;
  hasGenres: boolean;
  hasSummary: boolean;
}

export function useShowCard({ show }: ShowCardProps): UseShowCardResult {
  const meta = formatShowMeta(show);

  return {
    title: show.name || UNTITLED,
    meta,
    hasMeta: meta.length > 0,
    hasGenres: show.genres.length > 0,
    // The mapper strips HTML and trims, so an empty string means there is no summary.
    hasSummary: show.summary.length > 0,
  };
}
