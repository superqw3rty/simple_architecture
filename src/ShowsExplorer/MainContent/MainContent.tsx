import type { FC } from 'react';
import { StatusMessage } from '@/components/StatusMessage';
import styles from './MainContent.module.scss';
import { useMainContent } from './logic/useMainContent';
import { ErrorComponent } from './ErrorComponent';
import { Results, ResultsSkeleton } from './Results';

interface MainContentProps {
  term: string;
}

export const MainContent: FC<MainContentProps> = ({ term }) => {
  const {
    mainRef,
    results,
    genre,
    isIdle,
    isLoading,
    isBusy,
    hasError,
    isEmpty,
    emptyTitle,
    announcement,
    onRetry,
    onGenreChange,
    onPageChange,
  } = useMainContent(term);

  return (
    <>
      {/* Always in the DOM: a live region announces changes, not its own appearance. */}
      <p className={styles.announcer} aria-live="polite">
        {announcement}
      </p>

      {!isIdle && (
        <main
          ref={mainRef}
          tabIndex={-1}
          className={`container ${styles.mainContent}`}
          aria-busy={isBusy}
        >
          {hasError && (
            <div className={styles.status}>
              <ErrorComponent onRetry={onRetry} />
            </div>
          )}

          {isLoading && <ResultsSkeleton />}

          {isEmpty && (
            <div className={styles.status}>
              <StatusMessage
                symbol="∅"
                title={emptyTitle}
                description="Check the spelling or try a shorter title."
              />
            </div>
          )}

          {results && (
            <Results
              term={term}
              results={results}
              genre={genre}
              onGenreChange={onGenreChange}
              onPageChange={onPageChange}
            />
          )}
        </main>
      )}
    </>
  );
};
