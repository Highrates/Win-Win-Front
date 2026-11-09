import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthPageShell } from '@/components/AuthPageShell';
import {
  buildDesignerInviteConfirmPath,
  buildDesignerInviteEntryPath,
} from '@/lib/authRedirect';
import { normalizeInviteEmail } from '@/lib/designerInvites/inviteDesignerRoute';
import { getServerApiBase } from '@/lib/serverApiBase';
import { getServerUserSession } from '@/lib/userSessionServer';
import styles from '../inviteAuth.module.css';
import { InviteMismatchClient } from './InviteMismatchClient';

export default async function DesignerInviteMismatchPage({
  searchParams,
}: {
  searchParams?: {
    t?: string;
    /** Игнорируем — только для старых закладок; email берём на сервере. */
    sessionEmail?: string;
    inviteEmail?: string;
    reason?: string;
  };
}) {
  const token = (searchParams?.t ?? '').trim();
  if (!token) {
    redirect('/login/email');
  }

  const session = await getServerUserSession();
  if (!session.authenticated || !session.accessToken) {
    redirect(buildDesignerInviteEntryPath(token));
  }

  const api = getServerApiBase();
  const [verifyRes, meRes] = await Promise.all([
    fetch(`${api}/auth/designer-invite/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    }),
    fetch(`${api}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }),
  ]);

  const verifyBody = (await verifyRes.json().catch(() => ({}))) as {
    email?: string;
    message?: string;
  };

  if (!verifyRes.ok) {
    const message =
      typeof verifyBody.message === 'string' && verifyBody.message.trim()
        ? verifyBody.message.trim()
        : 'Ссылка приглашения недействительна или истекла';
    return (
      <AuthPageShell
        sectionAriaLabel="Ссылка приглашения недействительна"
        title="Ссылка недействительна"
        subtitle={message}
      >
        <p className={styles.footerLink}>
          <Link href="/account/profile">Перейти в профиль</Link>
        </p>
      </AuthPageShell>
    );
  }

  const inviteEmail = normalizeInviteEmail(verifyBody.email);
  if (!inviteEmail) {
    return (
      <AuthPageShell
        sectionAriaLabel="Ссылка приглашения недействительна"
        title="Ссылка недействительна"
        subtitle="В приглашении нет email. Попросите новую ссылку у пригласившего."
      >
        <p className={styles.footerLink}>
          <Link href="/account/profile">Перейти в профиль</Link>
        </p>
      </AuthPageShell>
    );
  }

  let sessionEmail = '';
  let sessionLabel = 'текущий аккаунт';
  let noEmail = false;

  if (meRes.ok) {
    const me = (await meRes.json().catch(() => ({}))) as {
      email?: string | null;
      phone?: string | null;
    };
    sessionEmail = normalizeInviteEmail(me.email);
    if (sessionEmail) {
      sessionLabel = sessionEmail;
    } else {
      noEmail = true;
      sessionLabel = me.phone?.trim()
        ? `телефон ${me.phone.trim()}`
        : 'аккаунт без email';
    }
  }

  if (sessionEmail && sessionEmail === inviteEmail) {
    redirect(buildDesignerInviteConfirmPath(token));
  }

  /** После выхода — entry invite-flow: сервер сам выберет регистрацию или логин. */
  const switchHref = buildDesignerInviteEntryPath(token);
  const switchLabel = `Выйти и продолжить как ${inviteEmail}`;

  return (
    <AuthPageShell
      sectionAriaLabel="Приглашение не совпадает с аккаунтом"
      title="Другой аккаунт"
      subtitle={
        <>
          Вы вошли как <strong>{sessionLabel || '—'}</strong>. Приглашение выдано на{' '}
          <strong>{inviteEmail}</strong>.
        </>
      }
    >
      <p className={styles.lead}>
        {noEmail
          ? 'У текущего аккаунта нет email. Добавьте в настройках email из приглашения или выйдите и войдите / зарегистрируйтесь с этим адресом.'
          : 'Чтобы принять приглашение, выйдите и войдите (или зарегистрируйтесь) с email из письма.'}
      </p>
      <InviteMismatchClient switchHref={switchHref} switchLabel={switchLabel} />
      <p className={styles.footerLink}>
        <Link href={noEmail ? '/account/profile?tab=settings' : '/account/profile'}>
          {noEmail ? 'Добавить email в настройках' : 'Остаться в текущем аккаунте'}
        </Link>
      </p>
    </AuthPageShell>
  );
}
