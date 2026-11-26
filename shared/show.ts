// API contract: the domain show model. The server builds it from TVmaze, the client renders it.
// Types only: no runtime code, no UI strings (D-53).

export type ShowStatus = 'Running' | 'Ended' | 'To Be Determined' | 'In Development';

export interface Show {
  id: number;
  name: string;
  genres: string[];
  imageUrl: string | null;
  rating: number | null;
  year: number | null;
  language: string | null;
  status: ShowStatus | null;
  summary: string;
}
