import { useId } from 'react';
import type { ChipProps } from '@/components/ui/Chip';
import type { ExampleChipsProps } from '../ExampleChips';

const EXAMPLES = ['Murder', 'Batman', 'The Office'];

interface UseExampleChipsResult {
  labelId: string;
  chips: ChipProps[];
}

export function useExampleChips({ onSelect, inputRef }: ExampleChipsProps): UseExampleChipsResult {
  const labelId = useId();

  return {
    labelId,
    chips: EXAMPLES.map((label): ChipProps => ({
      label,
      onClick: (): void => {
        onSelect(label);
        // The chips are removed when the header collapses: keep focus in the search field.
        inputRef.current?.focus();
      },
    })),
  };
}
