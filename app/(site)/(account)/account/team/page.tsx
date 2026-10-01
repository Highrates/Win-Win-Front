import { Suspense } from 'react';
import { TeamPageClient } from './TeamPageClient';
import { TeamPageSkeleton } from './TeamPageSkeleton';

export default function TeamPage() {
  return (
    <Suspense fallback={<TeamPageSkeleton />}>
      <TeamPageClient />
    </Suspense>
  );
}
