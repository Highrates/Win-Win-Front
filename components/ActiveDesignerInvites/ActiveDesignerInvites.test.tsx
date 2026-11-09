import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActiveDesignerInvites } from './ActiveDesignerInvites';
import type { ActiveDesignerInviteApi } from '@/lib/designerInvites/activeInvites';

function pendingItem(id = 'p1'): ActiveDesignerInviteApi {
  return {
    id,
    email: 'a@b.com',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    inviteLink: 'https://wupapa.test/invite',
    status: 'pending',
    statusLabel: 'Ожидает',
    canRevoke: true,
    canResend: true,
  };
}

describe('ActiveDesignerInvites collapsible open', () => {
  it('список сначала пустой, затем pending → details открыт', async () => {
    const { rerender } = render(
      <ActiveDesignerInvites items={[]} collapsible loading />,
    );
    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.getByText('Загрузка приглашений…')).toBeInTheDocument();

    rerender(
      <ActiveDesignerInvites items={[pendingItem()]} collapsible loading={false} />,
    );

    await waitFor(() => {
      const details = document.querySelector('details');
      expect(details).toBeTruthy();
      expect(details?.open).toBe(true);
    });
  });
});
