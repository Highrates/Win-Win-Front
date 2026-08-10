'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PRODUCT_CORRESPONDENCE_ADMIN_PANEL_ID } from '@/lib/productQa/constants';
import {
  useAdminProductQaStaffEvents,
  type ProductQaStaffNewQuestionPayload,
} from '@/hooks/useAdminProductQaStaffEvents';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminProductQaStaffToastStrings } from '@/lib/admin-i18n/adminProductQaStaffToastI18n';
import styles from './AdminProductQaStaffToast.module.css';

export type { ProductQaStaffNewQuestionPayload as ProductQaStaffToastPayload } from '@/hooks/useAdminProductQaStaffEvents';

const TOAST_MS = 10_000;

function AdminProductQaStaffToastView({
  payload,
  onDismiss,
}: {
  payload: ProductQaStaffNewQuestionPayload;
  onDismiss: () => void;
}) {
  const { locale } = useAdminLocale();
  const s = adminProductQaStaffToastStrings(locale);
  const href = `/admin/catalog/products/${encodeURIComponent(payload.productId)}#${PRODUCT_CORRESPONDENCE_ADMIN_PANEL_ID}`;

  return (
    <div className={styles.root} role="status" aria-live="polite">
      <div className={styles.body}>
        <p className={styles.title}>{s.title}</p>
        <p className={styles.product}>{payload.productName}</p>
        <p className={styles.preview}>{payload.preview}</p>
        <div className={styles.actions}>
          <Link href={href} className={styles.link} onClick={onDismiss}>
            {s.openProduct}
          </Link>
          <button type="button" className={styles.dismiss} onClick={onDismiss}>
            {s.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminProductQaStaffAlerts({ isLoginRoute }: { isLoginRoute: boolean }) {
  const [toast, setToast] = useState<ProductQaStaffNewQuestionPayload | null>(null);
  const dismiss = useCallback(() => setToast(null), []);
  const onVisibleStaffNewQuestion = useCallback((payload: ProductQaStaffNewQuestionPayload) => {
    setToast(payload);
  }, []);

  useAdminProductQaStaffEvents(!isLoginRoute, { onVisibleStaffNewQuestion });

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(dismiss, TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toast, dismiss]);

  if (!toast) return null;
  return <AdminProductQaStaffToastView payload={toast} onDismiss={dismiss} />;
}
