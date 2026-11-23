import type { FC } from 'react';
import type { Show } from '@/types/show';
import { Eyebrow } from '@/components/ui/Eyebrow';
import styles from './ShowCard.module.scss';
import { useShowCard } from './useShowCard';
import { CardImage } from './components/CardImage';

export interface ShowCardProps {
  show: Show;
}

export const ShowCard: FC<ShowCardProps> = ({ show }) => {
  const { meta, hasMeta, hasGenres, hasSummary } = useShowCard({ show });

  return (
    <div className={`container ${styles.card}`}>
      <div className={styles.infoBlock}>
        <CardImage show={show} />
        <div className={`container ${styles.info}`}>
          {hasMeta && <Eyebrow eyebrow={meta} size="small" />}
          <h3 className={styles.title}>{show.name}</h3>
          {hasGenres && (
            <ul className={styles.tags}>
              {show.genres.map((genre) => (
                <li key={genre} className={styles.tag}>
                  {genre}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {hasSummary && <p className={styles.description}>{show.summary}</p>}
    </div>
  );
};
