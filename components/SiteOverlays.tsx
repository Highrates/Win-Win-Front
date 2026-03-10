'use client';

import { SiteLoader } from '@/components/SiteLoader';
import { SiteTransition } from '@/components/SiteTransition';

export function SiteOverlays() {
  return (
    <>
      <SiteLoader />
      <SiteTransition />
    </>
  );
}
