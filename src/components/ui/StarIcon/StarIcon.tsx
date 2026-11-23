import type { FC } from 'react';

/** Decorative star, e.g. next to a rating. Takes the text color of its parent. */
export const StarIcon: FC = () => (
  <svg width="12" height="12" viewBox="0 -0.5 12 12" fill="none" aria-hidden="true">
    <path
      d="M1.96291 10.816L3.35391 6.68197L-8.58903e-05 4.43297H4.10791L5.57691 -3.00407e-05L7.07191 4.43297H11.1539L7.79991 6.68197L9.21692 10.816L5.57691 8.17697L1.96291 10.816Z"
      fill="currentColor"
    />
  </svg>
);
