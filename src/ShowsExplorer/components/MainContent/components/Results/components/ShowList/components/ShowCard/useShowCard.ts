import type { ShowCardProps } from './ShowCard';
import { formatShowMeta } from './utils/formatShowMeta';

/** What the card shows. Empty parts are not rendered: no empty eyebrow, list or paragraph. */
export function useShowCard({ show }: ShowCardProps) {
  const meta = formatShowMeta(show);

  return {
    meta,
    hasMeta: meta.length > 0,
    hasGenres: show.genres.length > 0,
    // The mapper strips HTML and trims, so an empty string means there is no summary.
    hasSummary: show.summary.length > 0,
  };
}
