'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAdminLogout() {
  const router = useRouter();

  return useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    router.replace('/admin/login');
    router.refresh();
  }, [router]);
}
