import type { FC } from 'react';
import styles from './ShowListSkeleton.module.scss';
import { SKELETON_KEYS } from './constants';
import { ShowCardSkeleton } from '../ShowCardSkeleton';

export const ShowListSkeleton: FC = () => (
  <div className={styles.showList} aria-hidden="true">
    {SKELETON_KEYS.map((key) => (
      <ShowCardSkeleton key={key} />
    ))}
  </div>
);
