import type { FC } from 'react';
import type { Show } from '@/types/show';
import { StarIcon } from '@/components/ui/StarIcon';
import styles from './CardImage.module.scss';
import { useCardImage } from './logic/useCardImage';

export interface CardImageProps {
  show: Show;
}

export const CardImage: FC<CardImageProps> = (props) => {
  const { hasRating, rating, hasPoster, posterUrl } = useCardImage(props);

  return (
    <div className={styles.imageBlock}>
      {hasRating && (
        <span className={styles.rating}>
          <span className={styles.star}>
            <StarIcon />
          </span>
          <span className={styles.ratingLabel}>Rating </span>
          {rating}
        </span>
      )}
      {hasPoster ? (
        <img
          width={128}
          height={180}
          loading="lazy"
          src={posterUrl}
          alt=""
          className={styles.image}
        />
      ) : (
        <div className={styles.placeholder} aria-hidden="true">
          No poster
        </div>
      )}
    </div>
  );
};
