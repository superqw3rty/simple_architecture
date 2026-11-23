import { useCallback, type ChangeEvent } from 'react';

export function useSearchInput(onChange: (query: string) => void) {
  const onSearchInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return { onSearchInputChange };
}
