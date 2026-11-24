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
