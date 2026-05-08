import { formatProductPriceRangeRub, formatProductPriceRub } from '@/lib/productSpecsFromApi';
import type { DesignerProjectLineItem } from './types';
import type { AccountDetailedProductMetaRow } from '@/components/AccountProductList/AccountDetailedProductRow';

export function formatProjectPriceRubDigits(priceRub: number | null): string {
  if (priceRub == null || !Number.isFinite(priceRub) || priceRub <= 0) return '—';
  const n = Math.round(priceRub);
  return `~${n.toLocaleString('ru-RU')}`;
}

function formatLocalLineCardPrice(line: DesignerProjectLineItem): string {
  const qtyRaw = line.quantity;
  const qty = typeof qtyRaw === 'number' && Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;

  if (line.priceRub != null && Number.isFinite(line.priceRub) && line.priceRub > 0) {
    return formatProductPriceRub(line.priceRub * qty);
  }

  const minU = line.catalogPriceMinRub;
  const maxU = line.catalogPriceMaxRub;
  if (
    typeof minU === 'number' &&
    typeof maxU === 'number' &&
    Number.isFinite(minU) &&
    Number.isFinite(maxU) &&
    minU > 0 &&
    maxU >= minU
  ) {
    const minT = minU * qty;
    const maxT = maxU * qty;
    if (Math.abs(minT - maxT) < 0.005) {
      return formatProductPriceRub(minT);
    }
    return formatProductPriceRangeRub(minT, maxT);
  }

  return '—';
}

export function designerLineToAccountRows(line: DesignerProjectLineItem): {
  id: string;
  name: string;
  price: string;
  metaRows: AccountDetailedProductMetaRow[];
} {
  const metaRows: AccountDetailedProductMetaRow[] = [];

  metaRows.push({
    label: 'Модификация',
    value: line.modificationLabel?.trim() || '—',
  });

  for (const row of line.elementMaterialRows) {
    metaRows.push({
      label: row.elementLabel,
      value: row.materialColorLabel,
    });
  }

  return {
    id: line.id,
    name: line.productName,
    price: formatLocalLineCardPrice(line),
    metaRows,
  };
}
