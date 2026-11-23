import type { FC, InputHTMLAttributes, ReactNode } from 'react';
import styles from './TextInput.module.scss';

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'>;

export interface TextInputProps extends NativeInputProps {
  /** Accessible name of the field. Not visible, read by screen readers. */
  label: string;
  /** Decorative element shown before the text, e.g. an icon. */
  icon?: ReactNode;
}

/** A single-line text field. Value and onChange are the native input props. */
export const TextInput: FC<TextInputProps> = ({ label, icon, type = 'text', ...rest }) => {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {icon}
      <input {...rest} type={type} className={styles.input} />
    </label>
  );
};
