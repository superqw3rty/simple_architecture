/** Production status of a show. */
export type ShowStatus = 'Running' | 'Ended' | 'To Be Determined' | 'In Development';

/**
 * A TV show as the app sees it: only the fields the UI needs, already cleaned up.
 * Built from the raw API response by a mapper in src/api.
 */
export interface Show {
  id: number;
  name: string;
  /** Empty array when the show has no genres. */
  genres: string[];
  /** Poster URL, null when the show has no image. */
  imageUrl: string | null;
  /** 0–10, null when the show has no votes. */
  rating: number | null;
  /** Year of the premiere, null when unknown. */
  year: number | null;
  /** Original language, "English". Null when unknown. */
  language: string | null;
  /** Null when the server sent no status or one the app does not know. */
  status: ShowStatus | null;
  /** Plain text, HTML already stripped. Empty string when there is no description. */
  summary: string;
}
