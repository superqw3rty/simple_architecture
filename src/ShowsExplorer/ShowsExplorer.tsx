import type { FC } from 'react';
import styles from './ShowsExplorer.module.scss';
import { useShowsExplorer } from './useShowsExplorer';
import { Header } from './Header';
import { MainContent } from './MainContent';

export const ShowsExplorer: FC = () => {
  const { isCompact, query, term, onQueryChange, inputRef } = useShowsExplorer();

  return (
    <div className={`container ${styles.explorer}`}>
      <Header
        query={query}
        onQueryChange={onQueryChange}
        isCompact={isCompact}
        inputRef={inputRef}
      />

      <MainContent term={term} />
    </div>
  );
};
