'use client';

import { AccountOrderWorkCard } from '@/components/AccountOrders/AccountOrderWorkCard';
import { Button } from '@/components/Button';
import type { WorkFeedItem } from '@/lib/account/workFeed';
import type { OrderProgramPublic } from '@/lib/orderProgram/publicOrderProgram';
import { mapUserOrderToWorkCard } from '@/lib/userOrders/mapOrderToWorkCard';
import { mapSourcingRequestToWorkCard } from '@/lib/userSourcingRequests/mapSourcingToWorkCard';
import styles from '../page.module.css';
import { OrdersFeedSkeleton } from './OrdersFeedSkeleton';

export type WorkTabFeedProps = {
  feed: WorkFeedItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  remainingCount: number;
  orderProgram: OrderProgramPublic | null;
  emptyText?: string;
  onLoadMore: () => void;
  onOpenOrder: (id: string, opts?: { status?: string | null }) => void;
  onOpenSourcing: (id: string, opts?: { status?: string | null }) => void;
};

export function WorkTabFeed({
  feed,
  loading,
  loadingMore,
  error,
  remainingCount,
  orderProgram,
  emptyText = 'Нет заказов и заявок в работе.',
  onLoadMore,
  onOpenOrder,
  onOpenSourcing,
}: WorkTabFeedProps) {
  return (
    <div className={styles.inWorkList}>
      {error ? <p className={styles.orderPrepError}>{error}</p> : null}
      {loading ? <OrdersFeedSkeleton /> : null}
      {!loading && !error && feed.length === 0 ? <p className={styles.inWorkEmpty}>{emptyText}</p> : null}
      {!loading
        ? feed.map((entry) =>
            entry.kind === 'order' ? (
              <AccountOrderWorkCard
                key={`order-${entry.order.id}`}
                {...mapUserOrderToWorkCard(entry.order, {
                  onOpenDetails: () => onOpenOrder(entry.order.id, { status: entry.order.status }),
                  orderProgram,
                })}
              />
            ) : (
              <AccountOrderWorkCard
                key={`sourcing-${entry.sourcing.id}`}
                {...mapSourcingRequestToWorkCard(entry.sourcing, {
                  onOpenDetails: () =>
                    onOpenSourcing(entry.sourcing.id, { status: entry.sourcing.status }),
                  orderProgram,
                })}
              />
            ),
          )
        : null}
      {!loading && remainingCount > 0 ? (
        <div className={styles.loadMoreRow}>
          <Button
            type="button"
            variant="secondary"
            className={styles.loadMoreButton}
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            Загрузить ещё ({remainingCount})
          </Button>
        </div>
      ) : null}
    </div>
  );
}
