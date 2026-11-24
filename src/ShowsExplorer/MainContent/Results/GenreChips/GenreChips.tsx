import type { FC } from 'react';
import { Chip, type ChipProps } from '@/components/ui/Chip';
import styles from './GenreChips.module.scss';

export interface GenreChipsProps {
  chips: ChipProps[];
}

export const GenreChips: FC<GenreChipsProps> = ({ chips }) => (
  <div className={styles.genreChips} role="group" aria-label="Filter by genre">
    {chips.map((chip) => (
      <Chip
        key={chip.label}
        label={chip.label}
        count={chip.count}
        isActive={chip.isActive}
        onClick={chip.onClick}
      />
    ))}
  </div>
);
