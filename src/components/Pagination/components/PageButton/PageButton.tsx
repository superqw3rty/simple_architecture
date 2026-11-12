import styles from './PageButton.module.scss';

interface PageButtonProps {
  label: string;
  ariaLabel: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

export function PageButton({ label, ariaLabel, isCurrent, isDisabled, onClick }: PageButtonProps) {
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
}
