'use client';

import { SiteOverlays } from '@/components/SiteOverlays';

/** Без ленивого импорта: оверлеи и лоадер попадают в первый клиентский чанк и монтируются сразу после гидрации. */
export function ClientOnlyOverlays() {
  return <SiteOverlays />;
}
