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
import { adminCollectionsListStrings } from '@/lib/admin-i18n/adminCollectionsI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import styles from '../catalog/catalogAdmin.module.css';
import type { AdminCuratedCollectionRow } from './collectionsAdminTypes';

function SortableRow({
  row,
  selected,
  onToggleSelect,
  kindLabel,
  t,
}: {
  row: AdminCuratedCollectionRow;
  selected: boolean;
  onToggleSelect: () => void;
  kindLabel: string;
  t: ReturnType<typeof adminCollectionsListStrings>;
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
          id={`col-${row.id}`}
          className={styles.adminCheckboxInTable}
          checked={selected}
          onChange={onToggleSelect}
          aria-label={t.selectOne(row.name)}
        />
      </td>
      <td>
        <Link href={`/admin/collections/${row.id}`}>{row.name}</Link>
      </td>
      <td>{kindLabel}</td>
      <td>{row.itemCount}</td>
      <td>
        <span className={`${styles.badge} ${row.isActive ? styles.badgeOn : styles.badgeOff}`}>
          {row.isActive ? t.inCatalog : t.hidden}
        </span>
      </td>
    </tr>
  );
}

type Props = {
  rows: AdminCuratedCollectionRow[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  kindLabel: (k: AdminCuratedCollectionRow['kind']) => string;
  onDragEnd: (event: DragEndEvent) => void;
};

export function CollectionsSortableTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  allSelected,
  kindLabel,
  onDragEnd,
}: Props) {
  const { locale } = useAdminLocale();
  const t = adminCollectionsListStrings(locale);
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
                  id="collections-select-all"
                  className={styles.adminCheckboxInTable}
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label={t.selectAllAria}
                />
              </th>
              <th>{t.thName}</th>
              <th>{t.thType}</th>
              <th>{t.thCount}</th>
              <th>{t.thVis}</th>
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
                  kindLabel={kindLabel(row.kind)}
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
