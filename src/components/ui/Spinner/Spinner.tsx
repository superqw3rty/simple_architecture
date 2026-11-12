import styles from './Spinner.module.scss';

export interface SpinnerProps {
  /** What is loading. Announced by screen readers. */
  label?: string;
}

/** A small inline loading indicator, e.g. for a background refresh. */
export function Spinner({ label = 'Loading' }: SpinnerProps) {
  return <span className={styles.spinner} role="status" aria-label={label} />;
}
