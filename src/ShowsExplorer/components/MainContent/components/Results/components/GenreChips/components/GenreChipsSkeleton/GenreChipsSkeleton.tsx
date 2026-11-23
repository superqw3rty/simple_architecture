import type { FC } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './GenreChipsSkeleton.module.scss';
import { CHIP_HEIGHT, SKELETON_CHIPS } from './constants';

export const GenreChipsSkeleton: FC = () => (
  <div className={styles.genreChips} aria-hidden="true">
    {SKELETON_CHIPS.map(({ key, width }) => (
      <Skeleton key={key} width={width} height={CHIP_HEIGHT} shape="pill" />
    ))}
  </div>
);
