'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { invalidateUserClientCaches } from '@/lib/userSessionClient';

export function InviteMismatchClient({
  switchHref,
  switchLabel = 'Выйти и продолжить с email приглашения',
}: {
  switchHref: string;
  switchLabel?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function onSwitch() {
    setBusy(true);
    try {
      await fetch('/api/user/logout', { method: 'POST', credentials: 'same-origin' });
      invalidateUserClientCaches({ authenticated: false });
    } catch {
      /* всё равно уходим на invite entry */
    } finally {
      window.location.replace(switchHref);
    }
  }

  return (
    <Button type="button" variant="primary" disabled={busy} onClick={() => void onSwitch()}>
      {busy ? 'Выход…' : switchLabel}
    </Button>
  );
}
