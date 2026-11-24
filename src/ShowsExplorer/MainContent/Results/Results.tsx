import type { FC } from 'react';
import type { Show } from '@/types/show';
import { Pagination } from '@/components/Pagination';
import styles from './Results.module.scss';
import { useResults } from './useResults';
import { GenreChips } from './GenreChips';
import { ShowList } from './ShowList';

export interface ResultsProps {
  term: string;
  shows: Show[];
}

export const Results: FC<ResultsProps> = (props) => {
  const {
    title,
    headingRef,
    hasGenres,
    chips,
    visibleShows,
    page,
    totalPages,
    pageCaption,
    onPageChange,
  } = useResults(props);

  return (
    <>
      <div className={styles.heading}>
        <h2 ref={headingRef} tabIndex={-1} className={styles.title} aria-live="polite">
          {title}
        </h2>
        {hasGenres && <p className={styles.hint}>Pick a genre to narrow it down</p>}
      </div>
      {hasGenres && <GenreChips chips={chips} />}
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
