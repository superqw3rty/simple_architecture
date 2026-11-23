import type { FC } from 'react';
import { Chip } from '@/components/ui/Chip';
import styles from './ExampleChips.module.scss';
import { useExampleChips } from './useExampleChips';

export interface ExampleChipsProps {
  onSelect: (query: string) => void;
}

export const ExampleChips: FC<ExampleChipsProps> = (props) => {
  const { chips } = useExampleChips(props);

  return (
    <div className={styles.container}>
      <p className={styles.label}>Try</p>
      {chips.map((chip) => (
        <Chip key={chip.label} label={chip.label} onClick={chip.onClick} />
      ))}
    </div>
  );
};
