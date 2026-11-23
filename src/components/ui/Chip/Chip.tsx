import type { FC } from 'react';
import styles from './Chip.module.scss';

export interface ChipProps {
  label: string;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
}

/** A clickable tag that can be toggled on and off. */
export const Chip: FC<ChipProps> = ({ label, count, isActive = false, onClick }) => {
  return (
    <button type="button" className={styles.chip} aria-pressed={isActive} onClick={onClick}>
      {label}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
};
