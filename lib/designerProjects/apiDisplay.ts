import type { AccountDetailedProductLine, AccountDetailedProductMetaRow } from '@/components/AccountProductList/AccountDetailedProductRow';
import { formatProductPriceRangeRub, formatProductPriceRub } from '@/lib/productSpecsFromApi';
import type { DesignerProjectLineApi, DesignerProjectLineSnapshotApi } from './apiTypes';

function formatLineTotalRubSingle(n: number | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return '—';
  return `~${Math.round(n).toLocaleString('ru-RU')} ₽`;
}

/** Цена в карточке строки проекта: итог по SKU или диапазон каталога × количество (нет SKU). */
export function formatDesignerProjectLineCardPrice(
  line: Pick<DesignerProjectLineApi, 'quantity' | 'lineTotalRub' | 'productVariantId'>,
  snap: DesignerProjectLineSnapshotApi,
): string {
  const qtyRaw = Number(line.quantity);
  const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;

  if (line.lineTotalRub != null && Number.isFinite(line.lineTotalRub) && line.lineTotalRub > 0) {
    return formatLineTotalRubSingle(line.lineTotalRub);
  }

  const minU = snap.catalogPriceMinRub;
  const maxU = snap.catalogPriceMaxRub;
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

export function apiLineToAccountDetailed(line: DesignerProjectLineApi): AccountDetailedProductLine {
  const snap = (line.snapshot ?? {}) as DesignerProjectLineSnapshotApi;
  const metaRows: AccountDetailedProductMetaRow[] = [];

  metaRows.push({
    label: 'Модификация',
    value: snap.modificationLabel?.trim() || '—',
  });

  if (Array.isArray(snap.elementMaterialRows) && snap.elementMaterialRows.length > 0) {
    for (const r of snap.elementMaterialRows) {
      metaRows.push({
        label: r.elementLabel,
        value: r.materialColorLabel,
      });
    }
  }

  const displayName =
    typeof snap.productName === 'string' && snap.productName.trim() ? snap.productName.trim() : 'Товар';

  return {
    id: line.id,
    name: displayName,
    price: formatDesignerProjectLineCardPrice(line, snap),
    metaRows,
  };
}
