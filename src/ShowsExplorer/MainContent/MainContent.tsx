import type { FC } from 'react';
import { StatusMessage } from '@/components/StatusMessage';
import styles from './MainContent.module.scss';
import { useMainContent } from './useMainContent';
import { ErrorComponent } from './ErrorComponent';
import { Results, ResultsSkeleton } from './Results';

interface MainContentProps {
  term: string;
}

export const MainContent: FC<MainContentProps> = ({ term }) => {
  const {
    mainRef,
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
        <main
          ref={mainRef}
          tabIndex={-1}
          className={`container ${styles.mainContent}`}
          aria-busy={isLoading}
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

          {hasResults && <Results key={term} term={term} shows={shows} />}
        </main>
      )}
    </>
  );
};
