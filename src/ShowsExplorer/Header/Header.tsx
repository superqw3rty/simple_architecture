import type { FC, RefObject } from 'react';
import styles from './Header.module.scss';
import { Logo } from './Logo';
import { Hero } from './Hero';
import { SearchInput } from './SearchInput';
import { ExampleChips } from './ExampleChips';

interface HeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  isCompact: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

export const Header: FC<HeaderProps> = ({ query, onQueryChange, isCompact, inputRef }) => {
  return (
    <header
      className={`${styles.header} ${isCompact ? styles.compactHeader : styles.fullHeightHeader}`}
    >
      <Logo />

      <div className={`container ${isCompact ? styles.compactHero : styles.fullHeightHero}`}>
        {!isCompact && <Hero />}

        <SearchInput value={query} onChange={onQueryChange} inputRef={inputRef} />

        {!isCompact && <ExampleChips onSelect={onQueryChange} inputRef={inputRef} />}
      </div>
    </header>
  );
};
