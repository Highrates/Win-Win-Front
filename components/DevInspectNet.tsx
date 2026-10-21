'use client';

import { useEffect } from 'react';
import { installInspectNet } from '@/lib/debug/inspectNet';

/** DEV: патч fetch + лог work-events. Вкл: ?inspectNet=1 или __wwInspectNet.enable() */
export function DevInspectNet() {
  useEffect(() => {
    installInspectNet();
  }, []);
  return null;
}
