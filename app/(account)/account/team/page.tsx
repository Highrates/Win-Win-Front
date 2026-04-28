import { Suspense } from 'react';
import { TeamPageClient } from './TeamPageClient';

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamPageClient />
    </Suspense>
  );
}
