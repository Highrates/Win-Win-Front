import type { AccountDetailedProductLine } from '@/components/AccountProductList/AccountDetailedProductRow';
import type { OrderPreparationLineApi } from './types';

export function mapOrderLineToAccountProduct(line: OrderPreparationLineApi): AccountDetailedProductLine {
  return {
    id: line.id,
    name: line.name,
    price: line.price,
    metaRows: line.metaRows,
  };
}
