import { Pagination } from '@/components/Pagination';
import { StatusMessage } from '@/components/StatusMessage';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { SearchIcon } from '@/components/ui/SearchIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { TextInput } from '@/components/ui/TextInput';
import styles from './App.module.scss';
import { Section } from './components/Section';
import { useApp } from './useApp';

// Temporary root: a showcase of the shared components. Stage 2 replaces it with <ShowsExplorer />.
export function App() {
  const { query, onQueryChange, chips, page, totalPages, onPageChange, onAction } = useApp();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Project skeleton</p>
        <h1 className={styles.title}>Shared components</h1>
      </header>

      <Section title="TextInput">
        <TextInput
          label="Search for a TV show"
          placeholder="Search for a TV show…"
          type="search"
          size="lg"
          icon={<SearchIcon />}
          value={query}
          onChange={onQueryChange}
        />
      </Section>

      <Section title="Chip">
        {chips.map((chip) => (
          <Chip
            key={chip.label}
            label={chip.label}
            count={chip.count}
            isActive={chip.isActive}
            onClick={chip.onSelect}
          />
        ))}
      </Section>

      <Section title="Button">
        <Button onClick={onAction}>Try again</Button>
        <Button variant="ghost" onClick={onAction}>
          Clear search
        </Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Pagination">
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      </Section>

      <Section title="Skeleton and Spinner">
        <Skeleton width={160} height={36} shape="pill" />
        <Skeleton width={240} height={20} shape="text" />
        <Skeleton height={96} />
        <Spinner />
      </Section>

      <Section title="StatusMessage">
        <StatusMessage
          tone="danger"
          symbol="!"
          title="The reel snapped"
          description="We couldn’t reach TVmaze. Check your connection and try again."
          actionLabel="Try again"
          onAction={onAction}
        />
        <StatusMessage
          symbol="∅"
          title="No shows found"
          description="Check the spelling or try a shorter title."
          actionLabel="Clear search"
          actionVariant="ghost"
          onAction={onAction}
        />
      </Section>
    </main>
  );
}
