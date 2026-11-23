import type { FC } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './ShowCardSkeleton.module.scss';

/** Placeholder with the same layout as ShowCard, shown while shows are loading. */
export const ShowCardSkeleton: FC = () => (
  <div className={`container ${styles.card}`} aria-hidden="true">
    <div className={styles.infoBlock}>
      <div className={styles.poster}>
        <Skeleton width="100%" height="100%" />
      </div>
      <div className={`container ${styles.info}`}>
        <Skeleton width={90} height={16} shape="text" />
        <Skeleton width="80%" height={28} shape="text" />
        <div className={styles.tags}>
          <Skeleton width={56} height={24} shape="pill" />
          <Skeleton width={48} height={24} shape="pill" />
        </div>
      </div>
    </div>
    <div className={styles.description}>
      <Skeleton height={16} shape="text" />
      <Skeleton height={16} shape="text" />
      <Skeleton width="60%" height={16} shape="text" />
    </div>
  </div>
);
