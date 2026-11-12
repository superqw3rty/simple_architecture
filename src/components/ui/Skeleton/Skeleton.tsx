import styles from './Skeleton.module.scss';

export interface SkeletonProps {
  /** Any CSS size: 120, '60%', '2rem'. Default: the full width of the parent. */
  width?: number | string;
  height?: number | string;
  shape?: 'block' | 'text' | 'pill';
}

/** A shimmering placeholder shown while the real content is loading. */
export function Skeleton({ width = '100%', height = 16, shape = 'block' }: SkeletonProps) {
  return (
    <span
      className={styles.skeleton}
      data-shape={shape}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
