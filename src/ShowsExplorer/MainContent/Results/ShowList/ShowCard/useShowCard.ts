import type { ShowCardProps } from './ShowCard';
import { formatShowMeta } from './utils/formatShowMeta';

interface UseShowCardResult {
  meta: string;
  hasMeta: boolean;
  hasGenres: boolean;
  hasSummary: boolean;
}

export function useShowCard({ show }: ShowCardProps): UseShowCardResult {
  const meta = formatShowMeta(show);

  return {
    meta,
    hasMeta: meta.length > 0,
    hasGenres: show.genres.length > 0,
    // The mapper strips HTML and trims, so an empty string means there is no summary.
    hasSummary: show.summary.length > 0,
  };
}
