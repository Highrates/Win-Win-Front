'use client';

import { useMemo } from 'react';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { useAdminLocale } from '@/lib/admin-i18n/adminLocaleContext';
import { adminOrderKpStrings } from '@/lib/admin-i18n/adminOrderKpI18n';
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
  const { locale } = useAdminLocale();
  const t = useMemo(() => adminOrderKpStrings(locale), [locale]);
  const g = readKpGrossFromSnapshot(snapshot);

  if (fullWidth) {
    return (
      <div className={kpStyles.grossFieldsStack}>
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder={t.grossLengthCm}
          aria-label={t.ariaGrossLength}
          value={mmToCmInput(g.lengthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { lengthMm: parseCmInputToMm(e.target.value) }))
          }
        />
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder={t.grossWidthCm}
          aria-label={t.ariaGrossWidth}
          value={mmToCmInput(g.widthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { widthMm: parseCmInputToMm(e.target.value) }))
          }
        />
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder={t.grossHeightCm}
          aria-label={t.ariaGrossHeight}
          value={mmToCmInput(g.heightMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { heightMm: parseCmInputToMm(e.target.value) }))
          }
        />
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder={t.grossVolumeM3}
          aria-label={t.ariaGrossVolume}
          value={m3InputFromVolumeLiters(g.volumeLiters)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { volumeLiters: parseOptionalM3(e.target.value) }))
          }
        />
        <AdminTextField
          className={kpStyles.fieldFull}
          type="text"
          inputMode="decimal"
          placeholder={t.grossWeightKg}
          aria-label={t.ariaGrossWeight}
          value={g.weightKg != null ? String(g.weightKg).replace('.', ',') : ''}
          onChange={(e) => {
            const raw = e.target.value.trim().replace(',', '.');
            const n = raw === '' ? null : parseFloat(raw);
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
          placeholder={t.grossLenShort}
          aria-label={t.ariaGrossLength}
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
          placeholder={t.grossWidShort}
          aria-label={t.ariaGrossWidth}
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
          placeholder={t.grossHeiShort}
          aria-label={t.ariaGrossHeight}
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
          placeholder={t.grossVolShort}
          aria-label={t.ariaGrossVolume}
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
          placeholder={t.grossWgtShort}
          aria-label={t.ariaGrossWeight}
          value={g.weightKg != null ? String(g.weightKg).replace('.', ',') : ''}
          onChange={(e) => {
            const raw = e.target.value.trim().replace(',', '.');
            const n = raw === '' ? null : parseFloat(raw);
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
