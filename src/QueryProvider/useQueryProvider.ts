import { useState } from 'react';
import { createQueryClient } from '@/api/queryClient';

export function useQueryProvider() {
  const [client] = useState(createQueryClient);

  return { client };
}
