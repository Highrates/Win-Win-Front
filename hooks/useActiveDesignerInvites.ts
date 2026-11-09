'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchActiveDesignerInvites,
  type ActiveDesignerInviteApi,
  type DesignerInviteStatusCounts,
} from '@/lib/designerInvites/activeInvites';

export const DESIGNER_INVITES_CHANGED_EVENT = 'winwin:designer-invites-changed';

export function dispatchDesignerInvitesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DESIGNER_INVITES_CHANGED_EVENT));
}

export function useActiveDesignerInvites(enabled: boolean) {
  const [items, setItems] = useState<ActiveDesignerInviteApi[]>([]);
  const [total, setTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [listLimit, setListLimit] = useState(50);
  const [statusCounts, setStatusCounts] = useState<DesignerInviteStatusCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setTotal(0);
      setTruncated(false);
      setStatusCounts(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveDesignerInvites();
      setItems(data.items);
      setTotal(data.total ?? data.items.length);
      setTruncated(Boolean(data.truncated));
      if (typeof data.listLimit === 'number') setListLimit(data.listLimit);
      setStatusCounts(data.statusCounts ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить приглашения');
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

  return { items, total, truncated, listLimit, statusCounts, loading, error, reload };
}
