export function formatResultsTitle(count: number, term: string): string {
  const noun = count === 1 ? 'show' : 'shows';
  return `${count} ${noun} for “${term}”`;
}
