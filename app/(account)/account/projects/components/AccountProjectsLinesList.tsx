'use client';

import { AccountDetailedProductRow } from '@/components/AccountProductList/AccountDetailedProductRow';
import productListStyles from '@/components/AccountProductList/AccountProductList.module.css';
import { apiLineToAccountDetailed } from '@/lib/designerProjects/apiDisplay';
import type { DesignerProjectLineApi } from '@/lib/designerProjects/apiTypes';
import { resolveMediaUrlForClient } from '@/lib/publicMediaUrl';
import { displayLineQuantity, lineProductPath } from '../accountProjectsFormat';

export type AccountProjectsLinesListProps = {
  visibleLines: DesignerProjectLineApi[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onLineSelectedChange: (lineId: string, checked: boolean) => void;
  onRemoveLine: (lineId: string) => void;
  onQuantityDelta: (lineId: string, delta: number) => void;
};

export function AccountProjectsLinesList({
  visibleLines,
  selectionMode,
  selectedIds,
  onLineSelectedChange,
  onRemoveLine,
  onQuantityDelta,
}: AccountProjectsLinesListProps) {
  return (
    <div className={productListStyles.productCardDetailedWrapper}>
      {visibleLines.map((line) => (
        <AccountDetailedProductRow
          key={line.id}
          product={apiLineToAccountDetailed(line)}
          selectionMode={selectionMode}
          selected={selectedIds.has(line.id)}
          onSelectedChange={(checked) => onLineSelectedChange(line.id, checked)}
          imageSrc={resolveMediaUrlForClient(line.resolvedImageUrl)}
          nameHref={lineProductPath(line)}
          productPagePath={lineProductPath(line)}
          onRemoveFromProject={() => onRemoveLine(line.id)}
          quantity={displayLineQuantity(line.quantity, line.unit)}
          unit={line.unit}
          onQuantityDelta={(d) => onQuantityDelta(line.id, d)}
        />
      ))}
    </div>
  );
}
