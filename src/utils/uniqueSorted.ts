/** Unique strings in alphabetical order, e.g. genres collected from a list of shows. */
export function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
