import {
  accountOrdersDetailFromQuery,
  accountOrdersTabForStatus,
  orderTabIndexFromQuery,
} from '@/lib/account/orders';
import { AccountOrdersPageClient } from './AccountOrdersPageClient';

type OrdersSearchParams = {
  tab?: string;
  order?: string | string[];
  sourcing?: string | string[];
  chat?: string | string[];
  status?: string | string[];
};

export default function OrdersPage({ searchParams }: { searchParams: OrdersSearchParams }) {
  const raw = searchParams?.tab;
  const tab = typeof raw === 'string' ? raw : undefined;
  const detail = accountOrdersDetailFromQuery(searchParams ?? {});
  const initialTabIndex =
    !tab && detail
      ? orderTabIndexFromQuery(accountOrdersTabForStatus(detail.kind, detail.status))
      : orderTabIndexFromQuery(tab);
  return (
    <AccountOrdersPageClient
      initialTabIndex={initialTabIndex}
      initialDetail={detail}
    />
  );
}
