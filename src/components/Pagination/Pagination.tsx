import { PageButton } from './components/PageButton';
import styles from './Pagination.module.scss';
import { usePagination } from './usePagination';

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Page switcher. Renders nothing when there is a single page. */
export function Pagination(props: PaginationProps) {
  const { isHidden, items, previous, next } = usePagination(props);

  if (isHidden) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <PageButton
        label="‹"
        ariaLabel="Previous page"
        isDisabled={previous.isDisabled}
        onClick={previous.onClick}
      />
      {items.map((item) =>
        item.isEllipsis ? (
          <span key={item.key} className={styles.ellipsis} aria-hidden="true">
            {item.label}
          </span>
        ) : (
          <PageButton
            key={item.key}
            label={item.label}
            ariaLabel={item.ariaLabel}
            isCurrent={item.isCurrent}
            onClick={item.onClick}
          />
        ),
      )}
      <PageButton
        label="›"
        ariaLabel="Next page"
        isDisabled={next.isDisabled}
        onClick={next.onClick}
      />
    </nav>
  );
}
