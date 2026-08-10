'use client';

import { useMemo } from 'react';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductQaQueueStrings } from '@/lib/admin-i18n/adminProductQaQueueI18n';

export function AdminProductQaQueuePageTitle({ className }: { className?: string }) {
  const { locale } = useAdminLocale();
  const s = useMemo(() => adminProductQaQueueStrings(locale), [locale]);
  return <h1 className={className}>{s.pageTitle}</h1>;
}
