'use client';

import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { coverUrlsFromUnknown } from '@/lib/account/caseApiSchema';
import pn from '../catalog/products/new/productNew.module.css';
import catalog from '../catalog/catalogAdmin.module.css';
import panel from './BrandProjectsPanel.module.css';
import type { BrandCaseRow } from './brandProjectsModel';

type Props = {
  list: BrandCaseRow[];
  editingId: string | null;
  onEdit: (row: BrandCaseRow) => void;
  onDelete: (id: string) => void;
};

export function BrandProjectsList({ list, editingId, onEdit, onDelete }: Props) {
  if (list.length === 0) {
    return <p className={catalog.muted}>Пока нет проектов. Добавьте первый.</p>;
  }

  return (
    <div className={pn.repeatList}>
      {list.map((row) => {
        const covers = coverUrlsFromUnknown(row.coverImageUrls, 1);
        const active = editingId === row.id;
        return (
          <div
            key={row.id}
            className={`${pn.elementCard}${active ? ` ${panel.listCardActive}` : ''}`}
          >
            <div className={pn.repeatRow}>
              {covers[0] ? (
                <div className={panel.listThumb}>
                  <img src={covers[0]} alt="" className={panel.listThumbImg} />
                </div>
              ) : null}
              <div className={pn.modFieldGrow}>
                <strong>{row.title}</strong>
                <p className={`${catalog.muted} ${panel.metaLine}`}>
                  {[
                    row.isPublished === false ? 'Черновик' : 'Опубликован',
                    row.location,
                    row.year,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className={pn.rowActions}>
                <AdminCompactBtn type="button" onClick={() => onEdit(row)}>
                  Изменить
                </AdminCompactBtn>
                <AdminCompactBtn type="button" variant="danger" onClick={() => onDelete(row.id)}>
                  Удалить
                </AdminCompactBtn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
