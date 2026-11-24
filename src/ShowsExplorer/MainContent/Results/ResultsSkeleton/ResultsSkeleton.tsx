import type { FC } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './ResultsSkeleton.module.scss';
import { GenreChipsSkeleton } from '../GenreChips';
import { ShowListSkeleton } from '../ShowList';

const TITLE_WIDTH = 240;

export const ResultsSkeleton: FC = () => (
  <>
    <div className={styles.title} aria-hidden="true">
      <Skeleton width={TITLE_WIDTH} height="1lh" shape="text" />
    </div>
    <GenreChipsSkeleton />
    <ShowListSkeleton />
  </>
);
