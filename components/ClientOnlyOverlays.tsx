'use client';

import { useState, useEffect } from 'react';

export function ClientOnlyOverlays() {
  const [Overlays, setOverlays] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@/components/SiteOverlays').then((m) => setOverlays(() => m.SiteOverlays));
  }, []);

  if (!Overlays) return null;
  return <Overlays />;
}
