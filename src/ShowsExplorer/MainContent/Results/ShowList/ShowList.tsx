import type { FC } from 'react';
import type { Show } from '@/types/show';
import styles from './ShowList.module.scss';
import { ShowCard } from './ShowCard';

interface ShowListProps {
  shows: Show[];
}

export const ShowList: FC<ShowListProps> = ({ shows }) => (
  // role="list": Safari drops list semantics from a <ul> with list-style: none.
  <ul className={styles.showList} role="list">
    {shows.map((show) => (
      <li key={show.id} className={styles.item}>
        <ShowCard show={show} />
      </li>
    ))}
  </ul>
);
