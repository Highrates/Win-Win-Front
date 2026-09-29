'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchActiveDesignerInvites,
  type ActiveDesignerInviteApi,
} from '@/lib/designerInvites/activeInvites';

export const DESIGNER_INVITES_CHANGED_EVENT = 'winwin:designer-invites-changed';

export function dispatchDesignerInvitesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DESIGNER_INVITES_CHANGED_EVENT));
}

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

  useEffect(() => {
    if (!enabled) return;
    const onChanged = () => void reload();
    window.addEventListener(DESIGNER_INVITES_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(DESIGNER_INVITES_CHANGED_EVENT, onChanged);
  }, [enabled, reload]);

  return { items, loading, reload };
}
