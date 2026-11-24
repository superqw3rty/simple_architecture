import type { Show } from '@/types/show';

const SEPARATOR = ' · ';

export function formatShowMeta({ year, language, status }: Show): string {
  return [year, language, status].filter((part) => part !== null).join(SEPARATOR);
}
