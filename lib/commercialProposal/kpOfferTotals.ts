import type { CommercialProposalLineApi } from './types';

export type KpOfferTotals = {
  oldTotalRub: number;
  newTotalRub: number;
  avgDiscountPercent: number;
};

export function kpLineUnitAfterDiscount(line: CommercialProposalLineApi): number {
  const unit = line.offerUnitPrice;
  const disc = line.discountPercent != null && Number.isFinite(line.discountPercent) ? line.discountPercent : 0;
  const factor = 1 - Math.min(100, Math.max(0, disc)) / 100;
  return Math.round(unit * factor * 100) / 100;
}

export function kpLineTotalRub(line: CommercialProposalLineApi): number {
  return Math.round(kpLineUnitAfterDiscount(line) * line.quantity * 100) / 100;
}

export function kpOfferAggregates(lines: CommercialProposalLineApi[]): KpOfferTotals {
  let oldTotal = 0;
  let newTotal = 0;
  let weightedDisc = 0;
  for (const l of lines) {
    const base = l.offerUnitPrice * l.quantity;
    oldTotal += base;
    newTotal += kpLineTotalRub(l);
    const d = l.discountPercent != null && Number.isFinite(l.discountPercent) ? l.discountPercent : 0;
    weightedDisc += base * d;
  }
  oldTotal = Math.round(oldTotal * 100) / 100;
  newTotal = Math.round(newTotal * 100) / 100;
  return {
    oldTotalRub: oldTotal,
    newTotalRub: newTotal,
    avgDiscountPercent: oldTotal > 0 ? weightedDisc / oldTotal : 0,
  };
}
