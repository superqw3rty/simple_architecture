import type { ExampleChipsProps } from './ExampleChips';

/** Queries that are known to return a good spread of shows and genres. */
const EXAMPLES = ['Murder', 'Batman', 'The Office'];

export function useExampleChips({ onSelect }: ExampleChipsProps) {
  return {
    chips: EXAMPLES.map((label) => ({ label, onClick: () => onSelect(label) })),
  };
}
