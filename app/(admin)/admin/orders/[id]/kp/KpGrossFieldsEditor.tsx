'use client';

import {
  type KpGrossDimensions,
  mmToCmInput,
  m3InputFromVolumeLiters,
  parseCmInputToMm,
  parseOptionalM3,
  readKpGrossFromSnapshot,
  writeKpGrossToSnapshot,
} from '@/lib/commercialProposal/kpGrossDimensions';
import styles from '../../../catalog/catalogAdmin.module.css';

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

const fullInputStyle = { width: '100%', boxSizing: 'border-box' as const };

export function KpGrossFieldsEditor({ snapshot, onSnapshotChange, fullWidth = false }: Props) {
  const g = readKpGrossFromSnapshot(snapshot);

  if (fullWidth) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="Длина, см"
          style={fullInputStyle}
          value={mmToCmInput(g.lengthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { lengthMm: parseCmInputToMm(e.target.value) }))
          }
          aria-label="Длина брутто, см"
        />
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="Ширина, см"
          style={fullInputStyle}
          value={mmToCmInput(g.widthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { widthMm: parseCmInputToMm(e.target.value) }))
          }
          aria-label="Ширина брутто, см"
        />
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="Высота, см"
          style={fullInputStyle}
          value={mmToCmInput(g.heightMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { heightMm: parseCmInputToMm(e.target.value) }))
          }
          aria-label="Высота брутто, см"
        />
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="Объём, м³"
          style={fullInputStyle}
          value={m3InputFromVolumeLiters(g.volumeLiters)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { volumeLiters: parseOptionalM3(e.target.value) }))
          }
          aria-label="Объём брутто, м³"
        />
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="Вес, кг"
          style={fullInputStyle}
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
          aria-label="Вес брутто, кг"
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 168 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="Д, см"
          style={{ width: 52 }}
          value={mmToCmInput(g.lengthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { lengthMm: parseCmInputToMm(e.target.value) }))
          }
          aria-label="Длина брутто, см"
        />
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="Ш, см"
          style={{ width: 52 }}
          value={mmToCmInput(g.widthMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { widthMm: parseCmInputToMm(e.target.value) }))
          }
          aria-label="Ширина брутто, см"
        />
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="В, см"
          style={{ width: 52 }}
          value={mmToCmInput(g.heightMm)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { heightMm: parseCmInputToMm(e.target.value) }))
          }
          aria-label="Высота брутто, см"
        />
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="м³"
          style={{ width: 72 }}
          value={m3InputFromVolumeLiters(g.volumeLiters)}
          onChange={(e) =>
            onSnapshotChange(patchGross(snapshot, { volumeLiters: parseOptionalM3(e.target.value) }))
          }
          aria-label="Объём брутто, м³"
        />
        <input
          className={styles.input}
          type="text"
          inputMode="decimal"
          placeholder="кг"
          style={{ width: 72 }}
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
          aria-label="Вес брутто, кг"
        />
      </div>
    </div>
  );
}
