/** "Showing 4–6 of 10": which items of the list the current page holds. Pages are 1-based. */
export function formatPageRange(page: number, pageSize: number, total: number): string {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);
  return `Showing ${from}–${to} of ${total}`;
}
