import { useCallback, type ChangeEvent } from 'react';

interface UseSearchInputResult {
  onSearchInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function useSearchInput(onChange: (query: string) => void): UseSearchInputResult {
  const onSearchInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return { onSearchInputChange };
}
