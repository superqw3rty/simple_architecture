import type { FC, InputHTMLAttributes, ReactNode, RefObject } from 'react';
import styles from './TextInput.module.scss';

type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'>;

export interface TextInputProps extends NativeInputProps {
  label: string;
  icon?: ReactNode;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export const TextInput: FC<TextInputProps> = ({
  label,
  icon,
  type = 'text',
  inputRef,
  ...rest
}) => {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {icon}
      <input {...rest} type={type} className={styles.input} ref={inputRef} />
    </label>
  );
};
