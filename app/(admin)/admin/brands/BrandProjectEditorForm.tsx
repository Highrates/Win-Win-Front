'use client';

import type { Dispatch, SetStateAction } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTextArea, AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import { CaseProductsField } from '@/app/(site)/(account)/account/cases/new/components/CaseProductsField';
import { CaseRoomTypeSelect } from '@/app/(site)/(account)/account/cases/new/components/CaseRoomTypeSelect';
import { formatBudgetDigitsGrouped, parseBudgetDigits } from '@/lib/formatBudgetRub';
import pn from '../catalog/products/new/productNew.module.css';
import catalog from '../catalog/catalogAdmin.module.css';
import panel from './BrandProjectsPanel.module.css';
import type { BrandProjectFormState } from './brandProjectsModel';

type Props = {
  brandId: string;
  editingId: string | null;
  form: BrandProjectFormState;
  setForm: Dispatch<SetStateAction<BrandProjectFormState>>;
  roomTypeOptions: string[];
  roomsOpen: boolean;
  setRoomsOpen: Dispatch<SetStateAction<boolean>>;
  coverAspectWarn: string | null;
  setCoverAspectWarn: (v: string | null) => void;
  saveMsg: string | null;
  saving: boolean;
  savingLabel: string;
  mediaLibraryLabel: string;
  onOpenCoverPicker: () => void;
  pickMediaFromLibrary: (kind: 'image' | 'video') => Promise<string | null>;
  onSave: () => void;
  onCancel: () => void;
};

export function BrandProjectEditorForm({
  brandId,
  editingId,
  form,
  setForm,
  roomTypeOptions,
  roomsOpen,
  setRoomsOpen,
  coverAspectWarn,
  setCoverAspectWarn,
  saveMsg,
  saving,
  savingLabel,
  mediaLibraryLabel,
  onOpenCoverPicker,
  pickMediaFromLibrary,
  onSave,
  onCancel,
}: Props) {
  return (
    <div className={pn.sectionStack}>
      <p className={`${catalog.muted} ${panel.formLead}`}>
        {editingId ? 'Редактирование проекта' : 'Новый проект'}
      </p>

      <label className={panel.publishLabel}>
        <input
          type="checkbox"
          checked={form.isPublished}
          onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
        />
        <span>Опубликован на витрине</span>
      </label>

      <AdminTextField
        label="Название"
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        required
      />

      <div>
        <AdminTextArea
          label="Короткое описание"
          value={form.shortDescription}
          onChange={(e) =>
            setForm((p) => ({ ...p, shortDescription: e.target.value.slice(0, 400) }))
          }
          rows={3}
          maxLength={400}
        />
        <p className={`${catalog.muted} ${panel.charCount}`}>
          {form.shortDescription.length}/400
        </p>
      </div>

      <div className={pn.repeatRow}>
        <AdminTextField
          className={pn.modFieldGrow}
          label="Локация"
          value={form.location}
          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          placeholder="Например: Москва"
        />
        <AdminTextField
          className={panel.yearField}
          label="Год"
          value={form.year}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              year: e.target.value.replace(/[^\d]/g, '').slice(0, 4),
            }))
          }
          inputMode="numeric"
        />
      </div>

      <AdminTextField
        label="Бюджет"
        value={formatBudgetDigitsGrouped(form.budgetDigits)}
        onChange={(e) =>
          setForm((p) => ({ ...p, budgetDigits: parseBudgetDigits(e.target.value) }))
        }
        inputMode="numeric"
        placeholder="Сумма"
      />

      <CaseRoomTypeSelect
        roomTypes={roomTypeOptions}
        selectedRooms={form.selectedRooms}
        roomsOpen={roomsOpen}
        onToggleOpen={() => setRoomsOpen((v) => !v)}
        onClose={() => setRoomsOpen(false)}
        onToggleRoom={(room) =>
          setForm((p) => ({
            ...p,
            selectedRooms: p.selectedRooms.includes(room)
              ? p.selectedRooms.filter((r) => r !== room)
              : [...p.selectedRooms, room],
          }))
        }
        onRemoveRoom={(room) =>
          setForm((p) => ({
            ...p,
            selectedRooms: p.selectedRooms.filter((r) => r !== room),
          }))
        }
      />

      <div>
        <h3 className={catalog.groupHeading}>Обложка</h3>
        <p className={`${catalog.muted} ${panel.coverHint}`}>Одно изображение, формат ~9:16</p>
        <div className={catalog.coverActions}>
          <AdminCompactBtn type="button" onClick={onOpenCoverPicker}>
            {mediaLibraryLabel}
          </AdminCompactBtn>
          {form.coverUrl ? (
            <AdminCompactBtn
              type="button"
              variant="danger"
              onClick={() => {
                setForm((p) => ({ ...p, coverUrl: '' }));
                setCoverAspectWarn(null);
              }}
            >
              Убрать
            </AdminCompactBtn>
          ) : null}
        </div>
        {coverAspectWarn ? <p className={panel.coverWarn}>{coverAspectWarn}</p> : null}
        {form.coverUrl ? (
          <div className={`${catalog.bgPreview} ${panel.coverPreview}`}>
            <img src={form.coverUrl} alt="" className={panel.coverPreviewImg} />
          </div>
        ) : null}
      </div>

      <CaseProductsField
        value={form.products}
        onChange={(next) => setForm((p) => ({ ...p, products: next }))}
        brandId={brandId}
      />

      <div>
        <h3 className={catalog.groupHeading}>Описание</h3>
        <RichBlock
          value={form.descriptionHtml}
          onChange={(html) => setForm((p) => ({ ...p, descriptionHtml: html }))}
          placeholder="Подробное описание проекта…"
          pickMediaFromLibrary={pickMediaFromLibrary}
        />
      </div>

      {saveMsg ? <p className={catalog.error}>{saveMsg}</p> : null}

      <div className={catalog.formActions}>
        <AdminCompactBtn type="button" variant="accent" disabled={saving} onClick={onSave}>
          {saving ? savingLabel : 'Сохранить проект'}
        </AdminCompactBtn>
        <AdminCompactBtn type="button" variant="outline" disabled={saving} onClick={onCancel}>
          Отмена
        </AdminCompactBtn>
      </div>
    </div>
  );
}
