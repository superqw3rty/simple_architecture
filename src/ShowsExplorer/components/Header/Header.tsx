import type { FC } from 'react';
import styles from './Header.module.scss';
import { Logo } from './components/Logo';
import { Hero } from './components/Hero';
import { SearchInput } from './components/SearchInput';
import { ExampleChips } from './components/ExampleChips';

interface HeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  isCompact: boolean;
}

export const Header: FC<HeaderProps> = ({ query, onQueryChange, isCompact }) => {
  return (
    <header
      className={`${styles.header} ${isCompact ? styles.compactHeader : styles.fullHeightHeader}`}
    >
      <Logo />

      <div className={`container ${isCompact ? styles.compactHero : styles.fullHeightHero}`}>
        {!isCompact && <Hero />}

        <SearchInput value={query} onChange={onQueryChange} />

        {!isCompact && <ExampleChips onSelect={onQueryChange} />}
      </div>
    </header>
  );
};
