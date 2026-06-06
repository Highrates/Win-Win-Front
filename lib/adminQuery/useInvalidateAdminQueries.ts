'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useInvalidateAdminQueries() {
  const queryClient = useQueryClient();

  return useCallback(
    (queryKey: readonly unknown[]) => queryClient.invalidateQueries({ queryKey }),
    [queryClient],
  );
}
