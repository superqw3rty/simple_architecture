import type { FC, ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'ghost';
}

export const Button: FC<ButtonProps> = ({ variant = 'primary', type = 'button', ...rest }) => {
  return <button {...rest} type={type} className={styles.button} data-variant={variant} />;
};
