import type { FC } from 'react';
import styles from './Chip.module.scss';

export interface ChipProps {
  label: string;
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
}

// No isActive — a plain button, not a toggle: aria-pressed is left out.
export const Chip: FC<ChipProps> = ({ label, count, isActive, onClick }) => {
  return (
    <button type="button" className={styles.chip} aria-pressed={isActive} onClick={onClick}>
      {label}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
};
