import type { FC } from 'react';
import styles from './Eyebrow.module.scss';

interface EyebrowProps {
  eyebrow: string;
  size?: 'small' | 'medium';
}

export const Eyebrow: FC<EyebrowProps> = ({ eyebrow, size = 'medium' }) => {
  return (
    <p className={styles.eyebrow} data-size={size}>
      {eyebrow}
    </p>
  );
};
