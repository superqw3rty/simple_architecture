import type { FC } from 'react';
import { SearchIcon } from '@/components/ui/SearchIcon';
import { TextInput } from '@/components/ui/TextInput';
import styles from './SearchInput.module.scss';
import { useSearchInput } from './useSearchInput';

interface SearchInputProps {
  value: string;
  onChange: (query: string) => void;
}

export const SearchInput: FC<SearchInputProps> = ({ value, onChange }) => {
  const { onSearchInputChange } = useSearchInput(onChange);

  return (
    <div className={styles.searchInput}>
      <TextInput
        label="Search for a TV show"
        placeholder="Search for a TV show…"
        type="search"
        icon={<SearchIcon />}
        value={value}
        onChange={onSearchInputChange}
      />
    </div>
  );
};
