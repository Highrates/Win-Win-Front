import type { SourcingCommercialProposalLineApi } from './types';

export function sourcingKpLineTotalRub(line: Pick<SourcingCommercialProposalLineApi, 'quantity' | 'offerUnitPrice'>): number {
  const unit = Number.isFinite(line.offerUnitPrice) ? line.offerUnitPrice : 0;
  const qty = Number.isFinite(line.quantity) ? line.quantity : 0;
  return Math.round(unit * qty * 100) / 100;
}

export function sourcingKpOrderTotalRub(lines: Pick<SourcingCommercialProposalLineApi, 'quantity' | 'offerUnitPrice'>[]): number {
  let sum = 0;
  for (const line of lines) sum += sourcingKpLineTotalRub(line);
  return Math.round(sum * 100) / 100;
}
