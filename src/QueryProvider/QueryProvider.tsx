import type { FC, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useQueryProvider } from './logic/useQueryProvider';

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: FC<QueryProviderProps> = ({ children }) => {
  const { client } = useQueryProvider();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
