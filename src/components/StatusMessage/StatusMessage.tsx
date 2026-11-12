import { Button, type ButtonProps } from '@/components/ui/Button';
import styles from './StatusMessage.module.scss';

export interface StatusMessageProps {
  /** A short glyph shown above the title, e.g. "!" or "∅". */
  symbol?: string;
  title: string;
  description?: string;
  /** danger — something went wrong, neutral — nothing to show. */
  tone?: 'neutral' | 'danger';
  /** Button text. The button is shown only when both the label and onAction are set. */
  actionLabel?: string;
  actionVariant?: ButtonProps['variant'];
  onAction?: () => void;
}

/** A centered message for the "no content" states: empty result, error, first visit. */
export function StatusMessage({
  symbol,
  title,
  description,
  tone = 'neutral',
  actionLabel,
  actionVariant = 'primary',
  onAction,
}: StatusMessageProps) {
  return (
    <div className={styles.message} data-tone={tone} role="status">
      {symbol && (
        <span className={styles.symbol} aria-hidden="true">
          {symbol}
        </span>
      )}
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <div className={styles.action}>
          <Button variant={actionVariant} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
