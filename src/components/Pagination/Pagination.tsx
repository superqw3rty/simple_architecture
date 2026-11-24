import type { FC } from 'react';
import { PageButton } from './PageButton';
import styles from './Pagination.module.scss';
import { usePagination } from './usePagination';

export interface PaginationProps {
  page: number;
  totalPages: number;
  caption?: string;
  onChange: (page: number) => void;
}

export const Pagination: FC<PaginationProps> = (props) => {
  const { caption } = props;
  const { isHidden, hasCaption, items, previous, next } = usePagination(props);

  if (isHidden) {
    return null;
  }

  return (
    <div className={styles.root}>
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
      {hasCaption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
};
