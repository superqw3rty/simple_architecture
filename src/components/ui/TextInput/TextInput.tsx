import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './TextInput.module.scss';

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'>;

export interface TextInputProps extends NativeInputProps {
  /** Accessible name of the field. Not visible, read by screen readers. */
  label: string;
  /** Decorative element shown before the text, e.g. an icon. */
  icon?: ReactNode;
  size?: 'md' | 'lg';
}

/** A single-line text field. Value and onChange are the native input props. */
export function TextInput({ label, icon, size = 'md', type = 'text', ...rest }: TextInputProps) {
  return (
    <label className={styles.field} data-size={size}>
      <span className={styles.label}>{label}</span>
      {icon}
      <input {...rest} type={type} className={styles.input} />
    </label>
  );
}
