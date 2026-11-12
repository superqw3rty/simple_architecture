import styles from './Chip.module.scss';

export interface ChipProps {
  label: string;
  /** Optional number shown after the label, e.g. how many items match. */
  count?: number;
  isActive?: boolean;
  onClick?: () => void;
}

/** A clickable tag that can be toggled on and off. */
export function Chip({ label, count, isActive = false, onClick }: ChipProps) {
  return (
    <button type="button" className={styles.chip} aria-pressed={isActive} onClick={onClick}>
      {label}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}
