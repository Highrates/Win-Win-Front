/** Публичные параметры программы своего заказа (совпадает с ответом `/settings/public/order-program`). */
export type OrderProgramPublic = {
  designerOwnCatalogBonusPercent: number;
  designerOwnMinimumCatalogSiteTotalRub: number;
};

/**
 * Расчёт бонуса дизайнера со своего заказа: база заказа (₽ каталога / итога) × %, если ≥ порога и % > 0.
 * Внутренний расчёт с копейками; в UI показываем только целые ₽.
 */
export function designerOwnExpectedBonusRub(
  basisSumRub: number,
  cfg: OrderProgramPublic | null | undefined,
): number | null {
  if (!cfg || !Number.isFinite(basisSumRub) || basisSumRub <= 0) return null;
  if (!cfg.designerOwnCatalogBonusPercent || cfg.designerOwnCatalogBonusPercent <= 0) return null;
  const min = cfg.designerOwnMinimumCatalogSiteTotalRub;
  if (basisSumRub < min) return null;
  const raw = (basisSumRub * cfg.designerOwnCatalogBonusPercent) / 100;
  return Math.round(raw * 100) / 100;
}

/** Подпись для блока «Ожидаемый бонус» в ЛК и карточках. */
export function formatDesignerOwnExpectedBonusLabel(
  basisSumRub: number,
  cfg: OrderProgramPublic | null | undefined,
): string {
  const rub = designerOwnExpectedBonusRub(basisSumRub, cfg);
  if (rub == null) return '—';
  const wholeRub = Math.round(rub);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(wholeRub);
}

export async function fetchPublicOrderProgram(): Promise<OrderProgramPublic | null> {
  try {
    const res = await fetch('/api/public/order-program', { cache: 'no-store' });
    if (!res.ok) return null;
    const j = (await res.json()) as Partial<OrderProgramPublic>;
    const designerOwnCatalogBonusPercent =
      typeof j.designerOwnCatalogBonusPercent === 'number' && Number.isFinite(j.designerOwnCatalogBonusPercent)
        ? Math.min(100, Math.max(0, j.designerOwnCatalogBonusPercent))
        : 0;
    const designerOwnMinimumCatalogSiteTotalRub =
      typeof j.designerOwnMinimumCatalogSiteTotalRub === 'number' && Number.isFinite(j.designerOwnMinimumCatalogSiteTotalRub)
        ? Math.max(0, Math.floor(j.designerOwnMinimumCatalogSiteTotalRub))
        : 0;
    return { designerOwnCatalogBonusPercent, designerOwnMinimumCatalogSiteTotalRub };
  } catch {
    return null;
  }
}
