import type { FC } from 'react';
import styles from './PageButton.module.scss';

interface PageButtonProps {
  label: string;
  ariaLabel: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

export const PageButton: FC<PageButtonProps> = ({
  label,
  ariaLabel,
  isCurrent,
  isDisabled,
  onClick,
}) => {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={ariaLabel}
      aria-current={isCurrent ? 'page' : undefined}
      disabled={isDisabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
