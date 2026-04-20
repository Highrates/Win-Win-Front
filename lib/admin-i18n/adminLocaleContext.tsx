'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { AdminLocale } from '@/lib/admin-i18n/adminChromeI18n';

export type AdminLocaleContextValue = {
  locale: AdminLocale;
  /** false до гидрации / синхронизации с cookie (как раньше в сайдбаре) */
  localeReady: boolean;
};

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

export function AdminLocaleProvider({
  locale,
  localeReady,
  children,
}: {
  locale: AdminLocale;
  localeReady: boolean;
  children: ReactNode;
}) {
  return (
    <AdminLocaleContext.Provider value={{ locale, localeReady }}>{children}</AdminLocaleContext.Provider>
  );
}

export function useAdminLocale(): AdminLocaleContextValue {
  const v = useContext(AdminLocaleContext);
  if (!v) {
    throw new Error('useAdminLocale: оберните страницу в AdminChrome (AdminLocaleProvider).');
  }
  return v;
}
