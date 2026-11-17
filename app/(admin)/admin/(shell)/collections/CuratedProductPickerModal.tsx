'use client';

import { useMemo } from 'react';
import { AdminProductMultiPickerModal } from '@/components/admin/AdminProductMultiPickerModal/AdminProductMultiPickerModal';
import { adminCollectionEditorStrings } from '@/lib/admin-i18n/adminCollectionsI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import type { AdminProductRow } from '../catalog/products/adminProductTypes';

type Props = {
  open: boolean;
  excludedProductIds: ReadonlySet<string>;
  onClose: () => void;
  onAdd: (products: AdminProductRow[]) => void;
};

/** Обёртка над общим product multi-picker для редактора коллекций. */
export function CuratedProductPickerModal({
  open,
  excludedProductIds,
  onClose,
  onAdd,
}: Props) {
  const { locale } = useAdminLocale();
  const str = useMemo(() => adminCollectionEditorStrings(locale), [locale]);

  return (
    <AdminProductMultiPickerModal
      open={open}
      excludedIds={excludedProductIds}
      alreadyInLabel={str.inCollection}
      title={str.addProduct}
      onClose={onClose}
      onAdd={onAdd}
    />
  );
}
