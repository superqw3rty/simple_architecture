import type { FC } from 'react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import styles from './StatusMessage.module.scss';
import { useStatusMessage } from './useStatusMessage';

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

/**
 * A message for the "no content" states: empty result, error.
 * The parent places it on the page and announces it: a live region that appears together with
 * its text is not read reliably, so the parent keeps one that is always there.
 */
export const StatusMessage: FC<StatusMessageProps> = (props) => {
  const {
    symbol,
    title,
    description,
    tone = 'neutral',
    actionLabel,
    actionVariant = 'primary',
    onAction,
  } = props;
  const { hasSymbol, hasDescription, hasAction } = useStatusMessage(props);

  return (
    <div className={styles.message} data-tone={tone}>
      {hasSymbol && (
        <span className={styles.symbol} aria-hidden="true">
          {symbol}
        </span>
      )}
      <h2 className={styles.title}>{title}</h2>
      {hasDescription && <p className={styles.description}>{description}</p>}
      {hasAction && (
        <div className={styles.action}>
          <Button variant={actionVariant} onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
