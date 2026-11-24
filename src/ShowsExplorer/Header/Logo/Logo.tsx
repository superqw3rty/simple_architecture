import type { FC } from 'react';
import styles from './Logo.module.scss';

export const Logo: FC = () => {
  return <h1 className={styles.logo}>TV Shows Explorer</h1>;
};
