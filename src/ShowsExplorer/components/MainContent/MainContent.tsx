import type { FC } from 'react';
import { StatusMessage } from '@/components/StatusMessage';
import styles from './MainContent.module.scss';
import { useMainContent } from './useMainContent';
import { ErrorComponent } from './components/ErrorComponent';
import { Results, ResultsSkeleton } from './components/Results';

interface MainContentProps {
  /** Trimmed and debounced: what gets searched. */
  term: string;
}

export const MainContent: FC<MainContentProps> = ({ term }) => {
  const {
    shows,
    isIdle,
    isLoading,
    hasError,
    isEmpty,
    emptyTitle,
    hasResults,
    announcement,
    onRetry,
  } = useMainContent(term);

  return (
    <>
      {/* Always in the DOM: a live region announces changes, not its own appearance. */}
      <p className={styles.announcer} aria-live="polite">
        {announcement}
      </p>

      {!isIdle && (
        <main className={`container ${styles.mainContent}`} aria-busy={isLoading}>
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

          {/* key: a new term starts with no genre selected and the first page. */}
          {hasResults && <Results key={term} term={term} shows={shows} />}
        </main>
      )}
    </>
  );
};
