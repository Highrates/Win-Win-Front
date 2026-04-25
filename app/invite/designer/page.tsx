import type { Metadata } from 'next';
import { InviteDesignerLandingClient } from './InviteDesignerLandingClient';

export const metadata: Metadata = {
  title: 'Приглашение Win-Win',
  description: 'Регистрация или вход по приглашению партнёра',
};

export default function InviteDesignerPage() {
  return (
    <div style={{ padding: '2rem 1.25rem', maxWidth: 480, margin: '0 auto' }}>
      <InviteDesignerLandingClient />
    </div>
  );
}
