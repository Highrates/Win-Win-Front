'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog/AdminConfirmDialog';
import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import { adminCommonI18n } from '@/lib/admin-i18n/adminCommonI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';

export type AdminConfirmRequest = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'accent' | 'danger';
};

type AdminConfirmContextValue = {
  confirm: (req: AdminConfirmRequest) => Promise<boolean>;
};

const AdminConfirmContext = createContext<AdminConfirmContextValue | null>(null);

export function AdminConfirmProvider({ children }: { children: ReactNode }) {
  const { locale } = useAdminLocale();
  const common = useMemo(() => adminCommonI18n(locale), [locale]);
  const [request, setRequest] = useState<AdminConfirmRequest | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const finish = useCallback((value: boolean) => {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback((req: AdminConfirmRequest): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setRequest(req);
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <AdminConfirmContext.Provider value={value}>
      {children}
      {request ? (
        <AdminConfirmDialog
          open
          title={request.title}
          confirmLabel={request.confirmLabel ?? common.delete}
          cancelLabel={request.cancelLabel ?? common.cancel}
          confirmVariant={request.confirmVariant ?? 'danger'}
          onClose={() => finish(false)}
          onConfirm={() => finish(true)}
        >
          {request.message != null ? (
            typeof request.message === 'string' ? (
              <p className={catalogStyles.muted} style={{ margin: 0 }}>
                {request.message}
              </p>
            ) : (
              request.message
            )
          ) : null}
        </AdminConfirmDialog>
      ) : null}
    </AdminConfirmContext.Provider>
  );
}

export function useAdminConfirm(): AdminConfirmContextValue {
  const ctx = useContext(AdminConfirmContext);
  if (!ctx) {
    throw new Error('useAdminConfirm must be used within AdminConfirmProvider');
  }
  return ctx;
}
