import type { CommercialProposalLineApi } from './types';

/** Габариты брутто в `snapshot` строки КП (не меняют вариант в каталоге). */
export type KpGrossDimensions = {
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  volumeLiters: number | null;
  weightKg: number | null;
};

const GROSS_KEYS = ['lengthMm', 'widthMm', 'heightMm', 'volumeLiters', 'weightKg'] as const;

function parseNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function readKpGrossFromSnapshot(snap: Record<string, unknown> | null): KpGrossDimensions {
  if (!snap) {
    return { lengthMm: null, widthMm: null, heightMm: null, volumeLiters: null, weightKg: null };
  }
  return {
    lengthMm: parseNum(snap.lengthMm),
    widthMm: parseNum(snap.widthMm),
    heightMm: parseNum(snap.heightMm),
    volumeLiters: parseNum(snap.volumeLiters),
    weightKg: parseNum(snap.weightKg),
  };
}

export function writeKpGrossToSnapshot(
  snap: Record<string, unknown> | null,
  gross: KpGrossDimensions,
): Record<string, unknown> {
  const base = snap && typeof snap === 'object' ? { ...snap } : {};
  for (const k of GROSS_KEYS) {
    const v = gross[k];
    if (v == null) delete base[k];
    else base[k] = v;
  }
  return base;
}

export function mergeVariantGrossIntoSnapshot(
  snap: Record<string, unknown>,
  variant: {
    lengthMm?: number | null;
    widthMm?: number | null;
    heightMm?: number | null;
    volumeLiters?: string | number | null;
    weightKg?: string | number | null;
  },
): Record<string, unknown> {
  const out = { ...snap };
  const cur = readKpGrossFromSnapshot(out);
  const vol =
    variant.volumeLiters != null && variant.volumeLiters !== ''
      ? parseNum(variant.volumeLiters)
      : null;
  const w =
    variant.weightKg != null && variant.weightKg !== '' ? parseNum(variant.weightKg) : null;
  const merged: KpGrossDimensions = {
    lengthMm: cur.lengthMm ?? variant.lengthMm ?? null,
    widthMm: cur.widthMm ?? variant.widthMm ?? null,
    heightMm: cur.heightMm ?? variant.heightMm ?? null,
    volumeLiters: cur.volumeLiters ?? vol,
    weightKg: cur.weightKg ?? w,
  };
  return writeKpGrossToSnapshot(out, merged);
}

export function parseCmInputToMm(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 10);
}

export function parseOptionalM3(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function mmToCmInput(mm: number | null | undefined): string {
  if (mm == null) return '';
  return String(mm / 10);
}

export function m3InputFromVolumeLiters(v: number | null | undefined): string {
  if (v == null) return '';
  return String(v).replace('.', ',');
}

function formatDimCm(mm: number | null): string {
  if (mm == null) return '—';
  const cm = mm / 10;
  return Number.isInteger(cm) ? String(cm) : cm.toFixed(1).replace('.', ',');
}

/** Строки габаритов для UI (L×W×H, м³, кг — каждая с новой строки). */
export function kpGrossDisplayLines(g: KpGrossDimensions): string[] {
  const lines: string[] = [];
  if (g.lengthMm != null && g.widthMm != null && g.heightMm != null) {
    lines.push(`${formatDimCm(g.lengthMm)}×${formatDimCm(g.widthMm)}×${formatDimCm(g.heightMm)} см`);
  } else {
    const dims = [g.lengthMm, g.widthMm, g.heightMm].filter((x) => x != null);
    if (dims.length) {
      lines.push(dims.map((d) => `${formatDimCm(d!)} см`).join(' × '));
    }
  }
  if (g.volumeLiters != null) {
    lines.push(`${String(g.volumeLiters).replace('.', ',')} м³`);
  }
  if (g.weightKg != null) {
    lines.push(`${String(g.weightKg).replace('.', ',')} кг`);
  }
  return lines.length ? lines : ['—'];
}

/** Одна строка для отображения габаритов позиции (legacy / компакт). */
export function formatKpGrossLineLabel(g: KpGrossDimensions): string {
  return kpGrossDisplayLines(g).join(' · ');
}

export function kpGrossTotalsDisplayLines(t: KpGrossTotals): string[] {
  if (!t.hasAny) return ['—'];
  const lines: string[] = [];
  if (t.totalVolumeM3 != null) lines.push(`${String(t.totalVolumeM3).replace('.', ',')} м³`);
  if (t.totalWeightKg != null) lines.push(`${String(t.totalWeightKg).replace('.', ',')} кг`);
  return lines.length ? lines : ['—'];
}

export function hasAnyKpGross(g: KpGrossDimensions): boolean {
  return GROSS_KEYS.some((k) => g[k] != null);
}

export type KpGrossTotals = {
  totalWeightKg: number | null;
  totalVolumeM3: number | null;
  hasAny: boolean;
};

export function kpGrossTotals(lines: CommercialProposalLineApi[]): KpGrossTotals {
  let weight = 0;
  let volume = 0;
  let hasWeight = false;
  let hasVolume = false;
  let hasAny = false;
  for (const line of lines) {
    const snap =
      line.snapshot && typeof line.snapshot === 'object' ? (line.snapshot as Record<string, unknown>) : null;
    const g = readKpGrossFromSnapshot(snap);
    if (!hasAnyKpGross(g)) continue;
    hasAny = true;
    const q = line.quantity;
    if (g.weightKg != null) {
      hasWeight = true;
      weight += g.weightKg * q;
    }
    if (g.volumeLiters != null) {
      hasVolume = true;
      volume += g.volumeLiters * q;
    }
  }
  return {
    hasAny,
    totalWeightKg: hasWeight ? Math.round(weight * 1000) / 1000 : null,
    totalVolumeM3: hasVolume ? Math.round(volume * 10000) / 10000 : null,
  };
}

export function formatKpGrossTotalsLabel(t: KpGrossTotals): string {
  if (!t.hasAny) return '—';
  const parts: string[] = [];
  if (t.totalVolumeM3 != null) parts.push(`${String(t.totalVolumeM3).replace('.', ',')} м³`);
  if (t.totalWeightKg != null) parts.push(`${String(t.totalWeightKg).replace('.', ',')} кг`);
  return parts.length ? parts.join(' · ') : '—';
}
