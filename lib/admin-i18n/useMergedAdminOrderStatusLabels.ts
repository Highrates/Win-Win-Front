'use client';

import { useMemo } from 'react';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderStatusLabels } from '@/lib/admin-i18n/adminOrdersI18n';

/** Подписи статусов заказа для админки (фиксированный справочник). */
export function useMergedAdminOrderStatusLabels(): Record<string, string> {
  const { locale } = useAdminLocale();
  return useMemo(() => adminOrderStatusLabels(locale), [locale]);
}
