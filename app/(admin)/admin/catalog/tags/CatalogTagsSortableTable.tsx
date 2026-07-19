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
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { adminCatalogTagsListStrings } from '@/lib/admin-i18n/adminCatalogTagsI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import styles from '../catalogAdmin.module.css';
import type { AdminCatalogTagListRow } from './catalogTagsAdminTypes';

function SortableRow({
  row,
  selected,
  onToggleSelect,
  t,
}: {
  row: AdminCatalogTagListRow;
  selected: boolean;
  onToggleSelect: () => void;
  t: ReturnType<typeof adminCatalogTagsListStrings>;
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
    <tr ref={setNodeRef} style={style}>
      <td className={styles.dragHandle} {...attributes} {...listeners} title={t.drag}>
        ⋮⋮
      </td>
      <td>
        <AccountCheckbox
          id={`catalog-tag-select-${row.id}`}
          className={styles.adminCheckboxInTable}
          checked={selected}
          onChange={onToggleSelect}
          aria-label={t.selectOne(row.name)}
        />
      </td>
      <td>
        <Link href={`/admin/catalog/tags/${row.id}`}>{row.name}</Link>
      </td>
      <td>{row.slug}</td>
      <td>{row.productCount}</td>
    </tr>
  );
}

type Props = {
  rows: AdminCatalogTagListRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  onDragEnd: (event: DragEndEvent) => void;
};

export function CatalogTagsSortableTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  allSelected,
  onDragEnd,
}: Props) {
  const { locale } = useAdminLocale();
  const t = adminCatalogTagsListStrings(locale);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = rows.map((r) => r.id);

  return (
    <div className={styles.tableWrap}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 36 }} aria-label={t.thOrder} />
              <th style={{ width: 44 }}>
                <AccountCheckbox
                  id="catalog-tags-select-all"
                  className={styles.adminCheckboxInTable}
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label={t.selectAllAria}
                />
              </th>
              <th>{t.thName}</th>
              <th>{t.thSlug}</th>
              <th>{t.thCount}</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {rows.map((row) => (
                <SortableRow
                  key={row.id}
                  row={row}
                  selected={selected.has(row.id)}
                  onToggleSelect={() => onToggle(row.id)}
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
