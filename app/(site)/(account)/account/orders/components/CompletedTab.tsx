'use client';

import { WorkTabFeed, type WorkTabFeedProps } from './WorkTabFeed';

export function CompletedTab(props: Omit<WorkTabFeedProps, 'emptyText'>) {
  return <WorkTabFeed {...props} emptyText="Нет завершённых заказов и заявок." />;
}
