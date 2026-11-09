import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthPageShell } from '@/components/AuthPageShell';
import { LoginEmailForm } from '@/components/auth-forms';
import { buildDesignerInviteEntryPath, sanitizeCallbackUrl } from '@/lib/authRedirect';
import { buildRegisterWithInviteHref } from '@/lib/designerInvites/loginHints';
import { getServerUserSession } from '@/lib/userSessionServer';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export const metadata: Metadata = {
  title: 'Вход в аккаунт — Wupapa',
  description: 'Вход по email или телефону и паролю',
};

export default async function LoginEmailPage({
  searchParams,
}: {
  searchParams?: {
    callbackUrl?: string;
    designerInvite?: string;
    prefillEmail?: string;
    designerInviteError?: string;
  };
}) {
  const inviteToken = (searchParams?.designerInvite ?? '').trim();
  const session = await getServerUserSession();
  if (session.authenticated) {
    /** С invite не уводим в кабинет «молча» — иначе токен теряется. */
    if (inviteToken) {
      redirect(buildDesignerInviteEntryPath(inviteToken));
    }
    redirect(sanitizeCallbackUrl(searchParams?.callbackUrl));
  }

  const registerHref = inviteToken
    ? buildRegisterWithInviteHref({
        token: inviteToken,
        email: searchParams?.prefillEmail,
      })
    : '/register/email';

  return (
    <AuthPageShell
      sectionAriaLabel="Вход в аккаунт"
      title="Вход в аккаунт"
      subtitle={
        <>
          Впервые у нас?{' '}
          <Link href={registerHref} className={styles.authLinkAccent}>
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginEmailForm />
    </AuthPageShell>
  );
}
