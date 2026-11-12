/**
 * Raw TVmaze responses, exactly as the server sends them.
 * Docs: https://www.tvmaze.com/api
 *
 * Used only inside src/api (endpoint functions and mappers).
 * The rest of the app works with the domain types from src/types, e.g. Show.
 * Nullable fields are marked from real responses: never trust a field to be present.
 */

export interface TvMazeImage {
  medium: string;
  original: string;
}

export interface TvMazeCountry {
  name: string;
  code: string;
  timezone: string;
}

/** A TV network or a streaming service. */
export interface TvMazeChannel {
  id: number;
  name: string;
  country: TvMazeCountry | null;
  officialSite: string | null;
}

export interface TvMazeLink {
  href: string;
  name?: string;
}

export type TvMazeShowStatus = 'Running' | 'Ended' | 'To Be Determined' | 'In Development';

export interface TvMazeShow {
  id: number;
  url: string;
  name: string;
  /** "Scripted", "Reality", "Animation", ... */
  type: string;
  language: string | null;
  genres: string[];
  status: TvMazeShowStatus;
  /** Minutes. */
  runtime: number | null;
  averageRuntime: number | null;
  /** ISO date, "2012-08-26". */
  premiered: string | null;
  ended: string | null;
  officialSite: string | null;
  schedule: { time: string; days: string[] };
  /** 0–10, null when the show has no votes. */
  rating: { average: number | null };
  weight: number;
  network: TvMazeChannel | null;
  webChannel: TvMazeChannel | null;
  dvdCountry: TvMazeCountry | null;
  externals: { tvrage: number | null; thetvdb: number | null; imdb: string | null };
  image: TvMazeImage | null;
  /** HTML fragment: "<p>...</p>". Strip the tags before showing it. */
  summary: string | null;
  /** Unix timestamp, seconds. */
  updated: number;
  _links: {
    self: TvMazeLink;
    previousepisode?: TvMazeLink;
    nextepisode?: TvMazeLink;
  };
}

/** One item of GET /search/shows?q=... */
export interface TvMazeSearchResult {
  /** Relevance of the match, higher is better. */
  score: number;
  show: TvMazeShow;
}

/** Response of GET /search/shows?q=... */
export type TvMazeSearchResponse = TvMazeSearchResult[];
