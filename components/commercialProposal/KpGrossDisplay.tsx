import {
  kpGrossDisplayLines,
  kpGrossTotalsDisplayLines,
  readKpGrossFromSnapshot,
  type KpGrossDimensions,
  type KpGrossTotals,
} from '@/lib/commercialProposal/kpGrossDimensions';
import type { CSSProperties } from 'react';

type Props = {
  snapshot: Record<string, unknown> | null;
  /** Прямые габариты вместо snapshot */
  gross?: KpGrossDimensions;
  className?: string;
  style?: CSSProperties;
};

export function KpGrossDisplay({ snapshot, gross, className, style }: Props) {
  const lines = kpGrossDisplayLines(gross ?? readKpGrossFromSnapshot(snapshot));
  return (
    <span
      className={className}
      style={{ display: 'block', lineHeight: 1.4, whiteSpace: 'pre-line', ...style }}
    >
      {lines.join('\n')}
    </span>
  );
}

export function KpGrossTotalsDisplay({ totals, className }: { totals: KpGrossTotals; className?: string }) {
  const lines = kpGrossTotalsDisplayLines(totals);
  return (
    <span className={className} style={{ display: 'inline-block', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
      {lines.join('\n')}
    </span>
  );
}
