import type { TvMazeShow } from '@/types/api/tvmaze';
import type { Show } from '@/types/show';
import { stripHtml } from '@/utils/stripHtml';

/** "2012-08-26" → 2012. Anything that does not start with a year → null. */
function toYear(date: string | null | undefined): number | null {
  const match = date?.match(/^\d{4}/);
  return match ? Number(match[0]) : null;
}

/**
 * Raw TVmaze show → the Show the app works with.
 * Tolerant on purpose: every field of the response may be null or missing.
 */
export function mapShow(dto: TvMazeShow): Show {
  return {
    id: dto.id,
    name: dto.name ?? 'Untitled',
    genres: dto.genres ?? [],
    imageUrl: dto.image?.medium ?? null,
    rating: dto.rating?.average ?? null,
    year: toYear(dto.premiered),
    language: dto.language ?? null,
    status: dto.status ?? 'Unknown',
    summary: stripHtml(dto.summary),
  };
}
