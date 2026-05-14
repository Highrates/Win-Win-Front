'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminBackendJson } from '@/lib/adminBackendFetch';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { mergeAdminOrderStatusLabels } from '@/lib/admin-i18n/adminOrdersI18n';

type SiteOrderLabelsPayload = {
  orderStatusLabels?: Record<string, string> | null;
};

export function useMergedAdminOrderStatusLabels(): Record<string, string> {
  const { locale } = useAdminLocale();
  const [overrides, setOverrides] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void adminBackendJson<SiteOrderLabelsPayload>('settings/admin/site')
      .then((data) => {
        if (cancelled) return;
        const raw = data?.orderStatusLabels;
        setOverrides(raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, string>) : null);
      })
      .catch(() => {
        if (!cancelled) setOverrides(null);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return useMemo(() => mergeAdminOrderStatusLabels(locale, overrides), [locale, overrides]);
}
