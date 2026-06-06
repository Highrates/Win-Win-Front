'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ADMIN_QUERY_GC_MS } from './defaults';

function makeAdminQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: ADMIN_QUERY_GC_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeAdminQueryClient);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
