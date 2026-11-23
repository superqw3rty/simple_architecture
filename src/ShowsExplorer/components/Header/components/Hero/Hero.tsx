import type { FC } from 'react';
import { Eyebrow } from '@/components/ui/Eyebrow';
import styles from './Hero.module.scss';

export const Hero: FC = () => {
  return (
    <div className={`container ${styles.hero}`}>
      <Eyebrow eyebrow="Search · filter · binge" size="medium" />
      <h1 className={styles.heroTitle}>What are we watching tonight?</h1>
      <p className={styles.heroDescription}>
        Type a title and browse shows from TVmaze. Narrow the results by genre.
      </p>
    </div>
  );
};
