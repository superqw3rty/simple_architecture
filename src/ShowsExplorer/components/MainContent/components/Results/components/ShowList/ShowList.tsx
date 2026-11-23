import type { FC } from 'react';
import type { Show } from '@/types/show';
import styles from './ShowList.module.scss';
import { ShowCard } from './components/ShowCard';

interface ShowListProps {
  shows: Show[];
}

export const ShowList: FC<ShowListProps> = ({ shows }) => (
  <ul className={styles.showList}>
    {shows.map((show) => (
      <li key={show.id} className={styles.item}>
        <ShowCard show={show} />
      </li>
    ))}
  </ul>
);
