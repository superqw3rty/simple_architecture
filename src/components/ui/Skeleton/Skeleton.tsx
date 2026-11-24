import type { FC } from 'react';
import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  shape?: 'block' | 'text' | 'pill';
}

export const Skeleton: FC<SkeletonProps> = ({ width = '100%', height = 16, shape = 'block' }) => {
  return (
    <span
      className={styles.skeleton}
      data-shape={shape}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};
