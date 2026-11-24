import type { FC } from 'react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import styles from './StatusMessage.module.scss';
import { useStatusMessage } from './useStatusMessage';

export interface StatusMessageProps {
  symbol?: string;
  title: string;
  description?: string;
  tone?: 'neutral' | 'danger';
  actionLabel?: string;
  actionVariant?: ButtonProps['variant'];
  onAction?: () => void;
}

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
