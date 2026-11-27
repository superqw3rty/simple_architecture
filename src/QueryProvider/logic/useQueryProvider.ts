import type { QueryClient } from '@tanstack/react-query';
import { queryClient } from '@/api';

interface UseQueryProviderResult {
  client: QueryClient;
}

// The singleton, not a client per mount: tasks update this same cache (D-56).
export function useQueryProvider(): UseQueryProviderResult {
  return { client: queryClient };
}
