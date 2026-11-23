import type { FC } from 'react';
import type { Show } from '@/types/show';
import { StarIcon } from '@/components/ui/StarIcon';
import styles from './CardImage.module.scss';
import { useCardImage } from './useCardImage';

export interface CardImageProps {
  show: Show;
}

export const CardImage: FC<CardImageProps> = (props) => {
  const { hasRating, rating, hasPoster, posterUrl, alt } = useCardImage(props);

  return (
    <div className={styles.imageBlock}>
      {hasRating && (
        <span className={styles.rating}>
          <span className={styles.star}>
            <StarIcon />
          </span>
          {rating}
        </span>
      )}
      {hasPoster ? (
        <img
          width={128}
          height={180}
          loading="lazy"
          src={posterUrl}
          alt={alt}
          className={styles.image}
        />
      ) : (
        <div className={styles.placeholder} role="img" aria-label={alt}>
          No poster
        </div>
      )}
    </div>
  );
};
