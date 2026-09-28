import { accountOrdersDetailFromQuery, orderTabIndexFromQuery } from '@/lib/account/orders';
import { AccountOrdersPageClient } from './AccountOrdersPageClient';

type OrdersSearchParams = {
  tab?: string;
  order?: string | string[];
  sourcing?: string | string[];
  chat?: string | string[];
};

export default function OrdersPage({ searchParams }: { searchParams: OrdersSearchParams }) {
  const raw = searchParams?.tab;
  const tab = typeof raw === 'string' ? raw : undefined;
  const detail = accountOrdersDetailFromQuery(searchParams ?? {});
  return (
    <AccountOrdersPageClient
      initialTabIndex={orderTabIndexFromQuery(tab)}
      initialDetail={detail}
    />
  );
}
