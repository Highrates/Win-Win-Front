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
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { adminBackendJson, revalidatePublicCatalogCache } from '@/lib/adminBackendFetch';
import { adminCategoryTableStrings } from '@/lib/admin-i18n/adminCategoriesI18n';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import styles from '../../catalogAdmin.module.css';

export type SubcatRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  _count: { primaryProducts: number; productCategories: number; children: number };
};

function SortableSubRow({ row, t }: { row: SubcatRow; t: ReturnType<typeof adminCategoryTableStrings> }) {
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
        <Link href={`/admin/catalog/categories/${row.id}`}>{row.name}</Link>
      </td>
      <td>{row._count.primaryProducts + row._count.productCategories}</td>
      <td>{row._count.children}</td>
    </tr>
  );
}

export function SubcategoriesDnD({
  parentCategoryId,
  items,
  onUpdated,
}: {
  parentCategoryId: string;
  items: SubcatRow[];
  onUpdated: () => void | Promise<void>;
}) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminCategoryTableStrings(locale), [locale]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((r) => r.id === active.id);
      const newIndex = items.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(items, oldIndex, newIndex);
      try {
        await adminBackendJson('catalog/admin/categories/reorder', {
          method: 'POST',
          body: JSON.stringify({ parentId: parentCategoryId, orderedIds: next.map((r) => r.id) }),
        });
        await revalidatePublicCatalogCache();
        router.refresh();
        await onUpdated();
      } catch {
        await onUpdated();
      }
    },
    [items, parentCategoryId, onUpdated, router],
  );

  const ids = items.map((r) => r.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 36 }} aria-label={t.thOrder} />
              <th>{t.thName}</th>
              <th>{t.thProducts}</th>
              <th>{t.thSubcats}</th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {items.map((row) => (
                <SortableSubRow key={row.id} row={row} t={t} />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  );
}
