export function formatPageRange(page: number, pageSize: number, total: number): string {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);
  return `Showing ${from}–${to} of ${total}`;
}
