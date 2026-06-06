'use client';

import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import {
  type KpGrossDimensions,
  mmToCmInput,
  m3InputFromVolumeLiters,
  parseCmInputToMm,
  parseOptionalM3,
  readKpGrossFromSnapshot,
  writeKpGrossToSnapshot,
} from '@/lib/commercialProposal/kpGrossDimensions';
import kpStyles from './kpEditor.module.css';

type Props = {
  snapshot: Record<string, unknown> | null;
  onSnapshotChange: (snap: Record<string, unknown>) => void;
  /** Инпуты на всю ширину контейнера (модалка). */
  fullWidth?: boolean;
};

function patchGross(
  snap: Record<string, unknown> | null,
  patch: Partial<KpGrossDimensions>,
): Record<string, unknown> {
  const cur = readKpGrossFromSnapshot(snap);
  return writeKpGrossToSnapshot(snap, { ...cur, ...patch });
}

export function KpGrossFieldsEditor({ snapshot, onSnapshotChange, fullWidth = false }: Props) {
  const g = readKpGrossFromSnapshot(snapshot);

  if (fullWidth) {
    return (
      <div className={kpStyles.grossFieldsStack}>
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder="Длина, см"
          aria-label="Длина брутто, см"
          value={mmToCmInput(g.lengthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { lengthMm: parseCmInputToMm(e.target.value) }))
          }
        />
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder="Ширина, см"
          aria-label="Ширина брутто, см"
          value={mmToCmInput(g.widthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { widthMm: parseCmInputToMm(e.target.value) }))
          }
        />
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder="Высота, см"
          aria-label="Высота брутто, см"
          value={mmToCmInput(g.heightMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { heightMm: parseCmInputToMm(e.target.value) }))
          }
        />
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder="Объём, м³"
          aria-label="Объём брутто, м³"
          value={m3InputFromVolumeLiters(g.volumeLiters)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { volumeLiters: parseOptionalM3(e.target.value) }))
          }
        />
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder="Вес, кг"
          aria-label="Вес брутто, кг"
          value={g.weightKg != null ? String(g.weightKg).replace('.', ',') : ''}
          onChange={(e) => {
            const t = e.target.value.trim().replace(',', '.');
            const n = t === '' ? null : parseFloat(t);
            onSnapshotChange(
              patchGross(snapshot, {
                weightKg: n != null && Number.isFinite(n) && n >= 0 ? n : null,
              }),
            );
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 168 }}>
      <div className={kpStyles.grossFieldsRow}>
        <AdminTextField
          controlClassName={kpStyles.fieldTiny52}
          className={kpStyles.fieldTiny52}
          type="text"
          inputMode="decimal"
          placeholder="Д, см"
          aria-label="Длина брутто, см"
          value={mmToCmInput(g.lengthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { lengthMm: parseCmInputToMm(e.target.value) }))
          }
        />
        <AdminTextField
          controlClassName={kpStyles.fieldTiny52}
          className={kpStyles.fieldTiny52}
          type="text"
          inputMode="decimal"
          placeholder="Ш, см"
          aria-label="Ширина брутто, см"
          value={mmToCmInput(g.widthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { widthMm: parseCmInputToMm(e.target.value) }))
          }
        />
        <AdminTextField
          controlClassName={kpStyles.fieldTiny52}
          className={kpStyles.fieldTiny52}
          type="text"
          inputMode="decimal"
          placeholder="В, см"
          aria-label="Высота брутто, см"
          value={mmToCmInput(g.heightMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { heightMm: parseCmInputToMm(e.target.value) }))
          }
        />
      </div>
      <div className={kpStyles.grossFieldsRowGap}>
        <AdminTextField
          controlClassName={kpStyles.fieldTiny72}
          className={kpStyles.fieldTiny72}
          type="text"
          inputMode="decimal"
          placeholder="м³"
          aria-label="Объём брутто, м³"
          value={m3InputFromVolumeLiters(g.volumeLiters)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { volumeLiters: parseOptionalM3(e.target.value) }))
          }
        />
        <AdminTextField
          controlClassName={kpStyles.fieldTiny72}
          className={kpStyles.fieldTiny72}
          type="text"
          inputMode="decimal"
          placeholder="кг"
          aria-label="Вес брутто, кг"
          value={g.weightKg != null ? String(g.weightKg).replace('.', ',') : ''}
          onChange={(e) => {
            const t = e.target.value.trim().replace(',', '.');
            const n = t === '' ? null : parseFloat(t);
            onSnapshotChange(
              patchGross(snapshot, {
                weightKg: n != null && Number.isFinite(n) && n >= 0 ? n : null,
              }),
            );
          }}
        />
      </div>
    </div>
  );
}
