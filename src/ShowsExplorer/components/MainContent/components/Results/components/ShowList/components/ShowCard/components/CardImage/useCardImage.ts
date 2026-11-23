import type { CardImageProps } from './CardImage';

export function useCardImage({ show }: CardImageProps) {
  return {
    // Not `show.rating && …`: a rating of 0 would render a bare "0".
    hasRating: show.rating !== null,
    rating: String(show.rating ?? ''),
    // An empty src makes the browser show a broken image, so a missing poster gets a placeholder.
    hasPoster: show.imageUrl !== null,
    posterUrl: show.imageUrl ?? '',
    alt: show.name,
  };
}
