'use client';

import { SiteLoader } from '@/components/SiteLoader';
import { SiteTransition } from '@/components/SiteTransition';
import { SourcingRequestResumeHost } from '@/components/SourcingRequest/SourcingRequestResumeHost';

export function SiteOverlays() {
  return (
    <>
      <SiteLoader />
      <SiteTransition />
      <SourcingRequestResumeHost />
    </>
  );
}
