import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { RegisterFlow } from '@/components/auth-forms/RegisterFlow';
import { buildDesignerInviteEntryPath, sanitizeCallbackUrl } from '@/lib/authRedirect';
import { getServerUserSession } from '@/lib/userSessionServer';

export const metadata: Metadata = {
  title: 'Регистрация по email — Wupapa',
  description: 'Создание аккаунта по email',
};

export default async function RegisterEmailPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; designerInvite?: string };
}) {
  const inviteToken = (searchParams?.designerInvite ?? '').trim();
  const session = await getServerUserSession();
  if (session.authenticated) {
    if (inviteToken) {
      redirect(buildDesignerInviteEntryPath(inviteToken));
    }
    redirect(sanitizeCallbackUrl(searchParams?.callbackUrl));
  }
  return (
    <Suspense fallback={null}>
      <RegisterFlow channel="email" />
    </Suspense>
  );
}
