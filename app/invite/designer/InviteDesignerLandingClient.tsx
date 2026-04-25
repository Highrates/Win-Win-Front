'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
const INVITE_KEY = 'winwin-designer-invite';

function Inner() {
  const sp = useSearchParams();
  const router = useRouter();
  const t = sp.get('t')?.trim() ?? '';
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!t) {
      setErr('Ссылка приглашения неполная');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/auth/designer-invite/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ token: t }),
          credentials: 'same-origin',
        });
        const j = (await res.json().catch(() => ({}))) as {
          message?: string;
          prefillRef?: string;
          accountExists?: boolean;
          email?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setErr(typeof j.message === 'string' ? j.message : 'Ссылка недействительна или срок истёк');
          return;
        }
        const prefillRef = (j.prefillRef ?? '').trim();
        const email = (j.email ?? '').trim();
        if (j.accountExists) {
          try {
            sessionStorage.setItem(INVITE_KEY, t);
          } catch {
            /* */
          }
          router.replace('/login/email?fromDesignerInvite=1');
          return;
        }
        const q = new URLSearchParams();
        if (prefillRef) q.set('ref', prefillRef);
        q.set('designerInvite', t);
        if (email) q.set('prefillEmail', email);
        router.replace(`/register/email?${q.toString()}`);
      } catch {
        if (!cancelled) setErr('Не удалось обработать ссылку. Повторите позже.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t, router]);

  if (err) {
    return <p style={{ color: 'var(--color-red, #c53029)' }}>{err}</p>;
  }
  return <p style={{ color: 'var(--color-gray, #9d9d9d)' }}>Перенаправление…</p>;
}

export function InviteDesignerLandingClient() {
  return (
    <Suspense fallback={<p>Загрузка…</p>}>
      <Inner />
    </Suspense>
  );
}
