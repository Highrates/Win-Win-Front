'use client';

import { useCallback } from 'react';

export function useAdminLogout() {
  return useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.assign('/admin/login');
  }, []);
}
