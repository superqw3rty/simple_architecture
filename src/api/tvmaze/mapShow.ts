import type { TvMazeShow } from '@/types/api/tvmaze';
import type { Show, ShowStatus } from '@/types/show';
import { stripHtml } from '@/utils/stripHtml';

/** "2012-08-26" → 2012. Anything that does not start with a year → null. */
function toYear(date: string | null | undefined): number | null {
  const match = date?.match(/^\d{4}/);
  return match ? Number(match[0]) : null;
}

/** A Record, not an array: adding a status to ShowStatus fails to compile until it is listed here. */
const KNOWN_STATUSES: Record<ShowStatus, true> = {
  Running: true,
  Ended: true,
  'To Be Determined': true,
  'In Development': true,
};

const isShowStatus = (value: string): value is ShowStatus => Object.hasOwn(KNOWN_STATUSES, value);

/** Keeps only the statuses the app knows: a new value from the server becomes null. */
function toStatus(status: string | null | undefined): ShowStatus | null {
  return status && isShowStatus(status) ? status : null;
}

/**
 * Raw TVmaze show → the Show the app works with.
 * Tolerant on purpose: every field of the response may be null or missing.
 */
export function mapShow(dto: TvMazeShow): Show {
  return {
    id: dto.id,
    name: dto.name ?? '',
    genres: dto.genres ?? [],
    imageUrl: dto.image?.medium ?? null,
    rating: dto.rating?.average ?? null,
    year: toYear(dto.premiered),
    language: dto.language ?? null,
    status: toStatus(dto.status),
    summary: stripHtml(dto.summary),
  };
}
