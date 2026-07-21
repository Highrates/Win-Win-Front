'use client';

import { useSearchParams } from 'next/navigation';
import { CatalogHubSkeleton } from './CatalogHubSkeleton';
import { CatalogZoneSkeleton } from './CatalogZoneSkeleton';

export function CatalogIndexLoading() {
  const tag = useSearchParams().get('tag');
  if (tag?.trim()) {
    return <CatalogZoneSkeleton />;
  }
  return <CatalogHubSkeleton />;
}
