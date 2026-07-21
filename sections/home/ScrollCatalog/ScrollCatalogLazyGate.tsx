'use client';

import type { ReactNode } from 'react';
import type { HomeCatalogRoot } from '@/lib/homeCatalog';
import { ScrollCatalogClient } from './ScrollCatalogClient';
import { useLazyStripMount } from './useLazyStripMount';

type Props = {
  roots: HomeCatalogRoot[];
  initialActiveSlug: string;
  staticView: ReactNode;
};

/**
 * До idle/interaction — только SSR staticView.
 * После — интерактивный ScrollCatalogClient (табы + полоса).
 */
export function ScrollCatalogLazyGate({
  roots,
  initialActiveSlug,
  staticView,
}: Props) {
  const { stripReady, activateStrip } = useLazyStripMount();

  if (!stripReady) {
    return (
      <div
        onPointerDownCapture={activateStrip}
        onKeyDownCapture={activateStrip}
      >
        {staticView}
      </div>
    );
  }

  return (
    <ScrollCatalogClient roots={roots} initialActiveSlug={initialActiveSlug} />
  );
}
