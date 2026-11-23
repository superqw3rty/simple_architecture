import type { FC } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './ResultsSkeleton.module.scss';
import { GenreChipsSkeleton } from '../GenreChips';
import { ShowListSkeleton } from '../ShowList';

/** Width of the "N shows for …" heading while it is loading (Figma: TitleSkeleton). */
const TITLE_WIDTH = 240;

/**
 * Mirrors Results block by block, so nothing jumps when the data arrives.
 * No pagination placeholder: the number of pages is unknown until the data is here (Figma: Loading).
 */
export const ResultsSkeleton: FC = () => (
  <>
    <div className={styles.title} aria-hidden="true">
      <Skeleton width={TITLE_WIDTH} height="1lh" shape="text" />
    </div>
    <GenreChipsSkeleton />
    <ShowListSkeleton />
  </>
);
