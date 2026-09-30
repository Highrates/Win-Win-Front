import { Suspense } from 'react';
import { FavoritesPageClient } from './FavoritesPageClient';

export default function FavoritesPage() {
  return (
    <Suspense fallback={null}>
      <FavoritesPageClient />
    </Suspense>
  );
}
