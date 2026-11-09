'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AuthPageShell } from '@/components/AuthPageShell';
import { Button } from '@/components/Button';
import { buildDesignerInviteProfilePath } from '@/lib/authRedirect';
import {
  buildInviteMismatchPath,
  DESIGNER_INVITE_ERROR_CODE,
} from '@/lib/designerInvites/loginHints';
import { invalidateUserClientCaches } from '@/lib/userSessionClient';
import styles from '../inviteAuth.module.css';

type VerifyState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | {
      phase: 'ready';
      joinTeamMessage: string;
      inviterLabel: string;
      prefillRef?: string;
    }
  | { phase: 'claiming' }
  | { phase: 'pending_admin'; message: string }
  | { phase: 'rejected'; message: string }
  | { phase: 'done' };

export function DesignerInviteConfirmClient({ token }: { token: string }) {
  const [state, setState] = useState<VerifyState>(
    token ? { phase: 'loading' } : { phase: 'error', message: 'Ссылка приглашения недействительна' },
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/auth/designer-invite/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ token }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          joinTeamMessage?: string;
          inviterLabel?: string;
          prefillRef?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setState({
            phase: 'error',
            message:
              typeof body.message === 'string' && body.message.trim()
                ? body.message.trim()
                : 'Ссылка приглашения недействительна или истекла',
          });
          return;
        }
        const inviterLabel =
          (body.inviterLabel ?? '').trim() ||
          (body.joinTeamMessage ?? '').replace(/^Вы войдёте в команду\s+/i, '').trim() ||
          'Партнёр Wupapa';
        setState({
          phase: 'ready',
          inviterLabel,
          joinTeamMessage:
            (body.joinTeamMessage ?? '').trim() || `Вы войдёте в команду ${inviterLabel}`,
          prefillRef: body.prefillRef,
        });
      } catch {
        if (!cancelled) {
          setState({ phase: 'error', message: 'Не удалось проверить приглашение' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onAccept = useCallback(async () => {
    if (!token) return;
    setState((prev) => (prev.phase === 'ready' ? { phase: 'claiming' } : prev));
    try {
      const res = await fetch('/api/user/designer-invite/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'same-origin',
      });
      const body = (await res.json().catch(() => ({}))) as {
        attached?: boolean;
        message?: string;
        code?: string;
        reason?: string;
        prefillRef?: string;
      };
      if (!res.ok) {
        const msg =
          typeof body.message === 'string' && body.message.trim()
            ? body.message.trim()
            : 'Не удалось принять приглашение';
        /** Чужой аккаунт / без email — на mismatch, не оставляем «успешный вход» на confirm. */
        if (body.code === DESIGNER_INVITE_ERROR_CODE.MISMATCH) {
          window.location.replace(buildInviteMismatchPath(token));
          return;
        }
        setState({ phase: 'error', message: msg });
        return;
      }
      if (body.attached === false) {
        const msg =
          typeof body.message === 'string' && body.message.trim()
            ? body.message.trim()
            : 'Не удалось принять приглашение: у вас уже есть спонсор в структуре.';
        if (body.reason === 'needs_admin_approval') {
          setState({ phase: 'pending_admin', message: msg });
          return;
        }
        setState({ phase: 'rejected', message: msg });
        return;
      }
      invalidateUserClientCaches({ authenticated: true });
      setState({ phase: 'done' });
      window.location.replace(buildDesignerInviteProfilePath(body.prefillRef));
    } catch {
      setState({ phase: 'error', message: 'Не удалось принять приглашение' });
    }
  }, [token]);

  if (state.phase === 'loading' || state.phase === 'claiming' || state.phase === 'done') {
    return (
      <AuthPageShell sectionAriaLabel="Подтверждение приглашения" title="Приглашение">
        <p>{state.phase === 'claiming' ? 'Принимаем приглашение…' : 'Проверяем ссылку…'}</p>
      </AuthPageShell>
    );
  }

  if (state.phase === 'pending_admin') {
    return (
      <AuthPageShell
        sectionAriaLabel="Заявка на проверке"
        title="Заявка на проверке"
        subtitle={state.message}
      >
        <p>
          <Link href="/account/profile">Перейти в профиль</Link>
        </p>
      </AuthPageShell>
    );
  }

  if (state.phase === 'error' || state.phase === 'rejected') {
    return (
      <AuthPageShell
        sectionAriaLabel="Приглашение"
        title={state.phase === 'rejected' ? 'Приглашение отклонено' : 'Не удалось принять'}
        subtitle={state.message}
      >
        <p>
          <Link href="/account/profile">Перейти в профиль</Link>
        </p>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      sectionAriaLabel="Подтверждение приглашения"
      title="Принять приглашение?"
      subtitle={state.joinTeamMessage}
    >
      <p className={styles.lead}>
        После подтверждения вы будете закреплены в команде <strong>{state.inviterLabel}</strong>.
        Сменить команду потом можно только через поддержку.
      </p>
      <div className={styles.actions}>
        <Button type="button" variant="primary" onClick={() => void onAccept()}>
          Принять и войти в команду
        </Button>
        <Link href="/account/profile">Отмена</Link>
      </div>
    </AuthPageShell>
  );
}
