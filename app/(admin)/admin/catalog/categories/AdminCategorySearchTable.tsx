'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { adminCategoryTableStrings } from '@/lib/admin-i18n/adminCategoriesI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import type { AdminCategoryRow } from './adminCategoryTypes';
import styles from '../catalogAdmin.module.css';

type Props = {
  rows: AdminCategoryRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  allRowsSelected: boolean;
};

export function AdminCategorySearchTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  allRowsSelected,
}: Props) {
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminCategoryTableStrings(locale), [locale]);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: 44 }}>
              <AccountCheckbox
                id="cat-select-all-search"
                className={styles.adminCheckboxInTable}
                checked={rows.length > 0 && allRowsSelected}
                onChange={onToggleAll}
                aria-label={t.selectAllCats}
              />
            </th>
            <th>{t.thName}</th>
            <th>{t.thParent}</th>
            <th title={t.thProductsTotalTitle}>{t.thProductsTotal}</th>
            <th>{t.thSubcats}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={!r.isActive ? styles.rowInactive : undefined}>
              <td>
                <AccountCheckbox
                  id={`cat-select-search-${r.id}`}
                  className={styles.adminCheckboxInTable}
                  checked={selected.has(r.id)}
                  onChange={() => onToggle(r.id)}
                  aria-label={t.selectCat(r.name)}
                />
              </td>
              <td>
                <Link href={`/admin/catalog/categories/${r.id}`}>{r.name}</Link>
              </td>
              <td>{r.parent ? r.parent.name : '—'}</td>
              <td
                title={t.directTitle(r._count.primaryProducts + r._count.productCategories)}
              >
                {r.recursiveProductCount}
              </td>
              <td>{r._count.children}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
