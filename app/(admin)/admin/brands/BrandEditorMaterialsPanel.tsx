'use client';

import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import pn from '../catalog/products/new/productNew.module.css';
import styles from '../catalog/catalogAdmin.module.css';

export type BrandEditorMaterialColorRow = {
  id: string;
  serverId?: string;
  name: string;
  imageUrl: string;
};

export type BrandEditorMaterialRow = {
  id: string;
  serverId?: string;
  name: string;
  colors: BrandEditorMaterialColorRow[];
};

type Strings = {
  sectionMaterials: string;
  saveMaterials: string;
  saving: string;
  loadingMaterials: string;
  materialNamePh: string;
  deleteMaterial: string;
  colorsHeading: string;
  colorNamePh: string;
  delete: string;
  addColorFromLib: string;
  addColorEmpty: string;
  addMaterial: string;
  materialsSaved: string;
  materialsAfterCreate: string;
  mediaLibrary: string;
};

type Props = {
  isEdit: boolean;
  strings: Strings;
  materials: BrandEditorMaterialRow[];
  materialsLoaded: boolean;
  materialsSaving: boolean;
  materialsMsg: string | null;
  onSave: () => void;
  onAddMaterial: () => void;
  onRemoveMaterial: (id: string) => void;
  onUpdateMaterialName: (id: string, name: string) => void;
  onAddColor: (materialId: string) => void;
  onRemoveColor: (materialId: string, colorId: string) => void;
  onUpdateColorName: (materialId: string, colorId: string, name: string) => void;
  onOpenColorImagePicker: (materialId: string, colorId: string) => void;
  onOpenColorBatchPicker: (materialId: string) => void;
};

export function BrandEditorMaterialsPanel({
  isEdit,
  strings: s,
  materials,
  materialsLoaded,
  materialsSaving,
  materialsMsg,
  onSave,
  onAddMaterial,
  onRemoveMaterial,
  onUpdateMaterialName,
  onAddColor,
  onRemoveColor,
  onUpdateColorName,
  onOpenColorImagePicker,
  onOpenColorBatchPicker,
}: Props) {
  if (!isEdit) {
    return <p className={styles.muted}>{s.materialsAfterCreate}</p>;
  }

  return (
    <div className={styles.tabPanelSection}>
      <div className={styles.sectionHead}>
        <h2 className={styles.groupHeading}>{s.sectionMaterials}</h2>
        <AdminCompactBtn
          type="button"
          variant="accent"
          onClick={onSave}
          disabled={materialsSaving || !materialsLoaded}
        >
          {materialsSaving ? s.saving : s.saveMaterials}
        </AdminCompactBtn>
      </div>

      {!materialsLoaded ? (
        <p className={styles.muted}>{s.loadingMaterials}</p>
      ) : (
        <div className={pn.repeatList}>
          {materials.map((m) => (
            <div key={m.id} className={pn.elementCard}>
              <div className={pn.repeatRow}>
                <AdminTextField
                  className={pn.modFieldGrow}
                  placeholder={s.materialNamePh}
                  value={m.name}
                  onChange={(e) => onUpdateMaterialName(m.id, e.target.value)}
                  aria-label={s.materialNamePh}
                />
                <AdminCompactBtn type="button" variant="danger" onClick={() => onRemoveMaterial(m.id)}>
                  {s.deleteMaterial}
                </AdminCompactBtn>
              </div>
              <div className={styles.materialsColorsBlock}>
                <p className={styles.materialsColorsHeading}>{s.colorsHeading}</p>
                {m.colors.map((c) => (
                  <div
                    key={c.id}
                    className={`${pn.repeatRow} ${pn.galleryRowLayout} ${styles.materialsColorRow}`}
                  >
                    {c.imageUrl ? (
                      <img className={pn.galleryThumb} src={c.imageUrl} alt="" />
                    ) : (
                      <div className={pn.galleryThumb} aria-hidden />
                    )}
                    <AdminTextField
                      className={pn.modFieldGrow}
                      placeholder={s.colorNamePh}
                      value={c.name}
                      onChange={(e) => onUpdateColorName(m.id, c.id, e.target.value)}
                      aria-label={s.colorNamePh}
                    />
                    <div className={pn.rowActions}>
                      <AdminCompactBtn type="button" onClick={() => onOpenColorImagePicker(m.id, c.id)}>
                        {s.mediaLibrary}
                      </AdminCompactBtn>
                      <AdminCompactBtn
                        type="button"
                        variant="danger"
                        onClick={() => onRemoveColor(m.id, c.id)}
                      >
                        {s.delete}
                      </AdminCompactBtn>
                    </div>
                  </div>
                ))}
                <div className={styles.formActions}>
                  <AdminCompactBtn type="button" onClick={() => onOpenColorBatchPicker(m.id)}>
                    {s.addColorFromLib}
                  </AdminCompactBtn>
                  <AdminCompactBtn type="button" onClick={() => onAddColor(m.id)}>
                    {s.addColorEmpty}
                  </AdminCompactBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {materialsMsg ? (
        <p
          className={
            materialsMsg === s.materialsSaved
              ? `${styles.muted} ${styles.materialsMsg}`
              : `${styles.error} ${styles.materialsMsg}`
          }
        >
          {materialsMsg}
        </p>
      ) : null}

      <div className={styles.formActions}>
        <AdminCompactBtn type="button" onClick={onAddMaterial}>
          {s.addMaterial}
        </AdminCompactBtn>
      </div>
    </div>
  );
}
