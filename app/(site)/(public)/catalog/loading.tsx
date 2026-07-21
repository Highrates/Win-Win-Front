import { Suspense } from 'react';
import { CatalogHubSkeleton } from './CatalogHubSkeleton';
import { CatalogIndexLoading } from './CatalogIndexLoading';

export default function Loading() {
  return (
    <Suspense fallback={<CatalogHubSkeleton />}>
      <CatalogIndexLoading />
    </Suspense>
  );
}
