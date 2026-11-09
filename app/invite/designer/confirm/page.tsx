import { redirect } from 'next/navigation';
import { buildDesignerInviteEntryPath } from '@/lib/authRedirect';
import { getServerUserSession } from '@/lib/userSessionServer';
import { DesignerInviteConfirmClient } from './DesignerInviteConfirmClient';

export default async function DesignerInviteConfirmPage({
  searchParams,
}: {
  searchParams?: { t?: string };
}) {
  const token = (searchParams?.t ?? '').trim();
  const session = await getServerUserSession();
  if (!session.authenticated) {
    redirect(token ? buildDesignerInviteEntryPath(token) : '/login/email');
  }
  return <DesignerInviteConfirmClient token={token} />;
}
