'use client';

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useMemo } from 'react';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { adminCategoryTableStrings } from '@/lib/admin-i18n/adminCategoriesI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import type { AdminCategoryRow } from './adminCategoryTypes';
import styles from '../catalogAdmin.module.css';

function SortableRow({
  row,
  selected,
  onToggleSelect,
  checkboxIdPrefix,
  t,
}: {
  row: AdminCategoryRow;
  selected: boolean;
  onToggleSelect: () => void;
  checkboxIdPrefix: string;
  t: ReturnType<typeof adminCategoryTableStrings>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className={!row.isActive ? styles.rowInactive : undefined}>
      <td className={styles.dragHandle} {...attributes} {...listeners} title={t.drag}>
        ⋮⋮
      </td>
      <td>
        <AccountCheckbox
          id={`${checkboxIdPrefix}-${row.id}`}
          className={styles.adminCheckboxInTable}
          checked={selected}
          onChange={onToggleSelect}
          aria-label={t.selectCat(row.name)}
        />
      </td>
      <td>
        <Link href={`/admin/catalog/categories/${row.id}`}>{row.name}</Link>
      </td>
      <td>{row.parent ? row.parent.name : '—'}</td>
      <td
        title={t.directTitle(row._count.primaryProducts + row._count.productCategories)}
      >
        {row.recursiveProductCount}
      </td>
      <td>{row._count.children}</td>
    </tr>
  );
}

function TableHead({
  selectAllProps,
  t,
}: {
  selectAllProps: { id: string; checked: boolean; onChange: () => void; ariaLabel: string };
  t: ReturnType<typeof adminCategoryTableStrings>;
}) {
  return (
    <thead>
      <tr>
        <th style={{ width: 36 }} aria-label={t.thOrder} />
        <th style={{ width: 44 }}>
          <AccountCheckbox
            id={selectAllProps.id}
            className={styles.adminCheckboxInTable}
            checked={selectAllProps.checked}
            onChange={selectAllProps.onChange}
            aria-label={selectAllProps.ariaLabel}
          />
        </th>
        <th>{t.thName}</th>
        <th>{t.thParent}</th>
        <th title={t.thProductsTotalTitle}>{t.thProductsTotal}</th>
        <th>{t.thSubcats}</th>
      </tr>
    </thead>
  );
}

type Props = {
  rows: AdminCategoryRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  allSectionSelected: boolean;
  selectAllCheckboxId: string;
  selectAllAriaLabel: string;
  checkboxIdPrefix: string;
  onDragEnd: (event: DragEndEvent) => void;
};

export function AdminCategorySortableTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  allSectionSelected,
  selectAllCheckboxId,
  selectAllAriaLabel,
  checkboxIdPrefix,
  onDragEnd,
}: Props) {
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminCategoryTableStrings(locale), [locale]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = rows.map((r) => r.id);

  return (
    <div className={styles.tableWrap}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <table className={styles.table}>
          <TableHead
            t={t}
            selectAllProps={{
              id: selectAllCheckboxId,
              checked: allSectionSelected,
              onChange: onToggleAll,
              ariaLabel: selectAllAriaLabel,
            }}
          />
          <tbody>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {rows.map((row) => (
                <SortableRow
                  key={row.id}
                  row={row}
                  selected={selected.has(row.id)}
                  onToggleSelect={() => onToggle(row.id)}
                  checkboxIdPrefix={checkboxIdPrefix}
                  t={t}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}
