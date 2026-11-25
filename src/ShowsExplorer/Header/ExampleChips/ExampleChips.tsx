import type { FC, RefObject } from 'react';
import { Chip } from '@/components/ui/Chip';
import styles from './ExampleChips.module.scss';
import { useExampleChips } from './logic/useExampleChips';

export interface ExampleChipsProps {
  onSelect: (query: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export const ExampleChips: FC<ExampleChipsProps> = ({ onSelect, inputRef }) => {
  const { labelId, chips } = useExampleChips({ onSelect, inputRef });

  return (
    <div className={styles.container} role="group" aria-labelledby={labelId}>
      <p id={labelId} className={styles.label}>
        Try
      </p>
      {chips.map((chip) => (
        <Chip key={chip.label} label={chip.label} onClick={chip.onClick} />
      ))}
    </div>
  );
};
