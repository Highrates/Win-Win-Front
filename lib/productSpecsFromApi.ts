/** Разбор `specsJson` товара с витрины (тот же формат, что в админке). */
export function parseProductSpecsFromApi(raw: unknown): {
  colors: { name: string; imageUrl: string }[];
  materials: string[];
  sizes: string[];
} {
  const out = {
    colors: [] as { name: string; imageUrl: string }[],
    materials: [] as string[],
    sizes: [] as string[],
  };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.colors)) {
    for (const c of o.colors) {
      if (c && typeof c === 'object') {
        const x = c as Record<string, unknown>;
        if (typeof x.name === 'string' && typeof x.imageUrl === 'string' && x.name.trim() && x.imageUrl.trim()) {
          out.colors.push({ name: x.name.trim(), imageUrl: x.imageUrl.trim() });
        }
      }
    }
  }
  if (Array.isArray(o.materials)) {
    for (const m of o.materials) {
      if (m && typeof m === 'object' && typeof (m as Record<string, unknown>).name === 'string') {
        const n = String((m as Record<string, unknown>).name).trim();
        if (n) out.materials.push(n);
      }
    }
  }
  if (Array.isArray(o.sizes)) {
    for (const s of o.sizes) {
      if (s && typeof s === 'object' && typeof (s as Record<string, unknown>).value === 'string') {
        const v = String((s as Record<string, unknown>).value).trim();
        if (v) out.sizes.push(v);
      }
    }
  }
  return out;
}

export function parseProductPriceFromApi(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function formatProductPriceRub(price: number): string {
  const formatted = Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `~${formatted} ₽`;
}
