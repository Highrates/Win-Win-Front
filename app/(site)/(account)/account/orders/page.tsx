import { orderTabIndexFromQuery } from '@/lib/account/orders';
import { AccountOrdersPageClient } from './AccountOrdersPageClient';

export default function OrdersPage({ searchParams }: { searchParams: { tab?: string } }) {
  const raw = searchParams?.tab;
  const tab = typeof raw === 'string' ? raw : undefined;
  return <AccountOrdersPageClient initialTabIndex={orderTabIndexFromQuery(tab)} />;
}
