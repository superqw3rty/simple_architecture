import { useState } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { createQueryClient } from '@/api/queryClient';

interface UseQueryProviderResult {
  client: QueryClient;
}

export function useQueryProvider(): UseQueryProviderResult {
  const [client] = useState(createQueryClient);

  return { client };
}
