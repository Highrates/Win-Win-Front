'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchActiveDesignerInvites,
  type ActiveDesignerInviteApi,
} from '@/lib/designerInvites/activeInvites';

export function useActiveDesignerInvites(enabled: boolean) {
  const [items, setItems] = useState<ActiveDesignerInviteApi[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await fetchActiveDesignerInvites());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, loading, reload };
}
