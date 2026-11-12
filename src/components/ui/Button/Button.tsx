import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  /** primary — the main action on the screen, ghost — a secondary one. */
  variant?: 'primary' | 'ghost';
}

export function Button({ variant = 'primary', type = 'button', ...rest }: ButtonProps) {
  return <button {...rest} type={type} className={styles.button} data-variant={variant} />;
}
