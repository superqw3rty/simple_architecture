import type { FC } from 'react';
import type { Show } from '@/types/show';
import { Pagination } from '@/components/Pagination';
import styles from './Results.module.scss';
import { useResults } from './useResults';
import { GenreChips } from './components/GenreChips';
import { ShowList } from './components/ShowList';

export interface ResultsProps {
  term: string;
  /** Everything the search returned, not filtered and not paged. */
  shows: Show[];
}

export const Results: FC<ResultsProps> = (props) => {
  const { title, hasGenres, chips, visibleShows, page, totalPages, pageCaption, onPageChange } =
    useResults(props);

  return (
    <>
      <div className={styles.heading}>
        {/* Live: picking a genre changes the count. A new term is announced by MainContent. */}
        <h2 className={styles.title} aria-live="polite">
          {title}
        </h2>
        {hasGenres && <p className={styles.hint}>Pick a genre to narrow it down</p>}
      </div>
      <GenreChips chips={chips} />
      <ShowList shows={visibleShows} />
      <Pagination
        page={page}
        totalPages={totalPages}
        caption={pageCaption}
        onChange={onPageChange}
      />
    </>
  );
};
