'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { SourcingRequestModal } from './SourcingRequestModal';
import { consumeSourcingResumeFromUrl, isSourcingResumeSearch } from './sourcingDraft';

function SourcingRequestResumeHostInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [resumeDraft, setResumeDraft] = useState(false);

  const tryOpenFromUrl = useCallback(() => {
    if (pathname.startsWith('/admin')) return;
    if (typeof window === 'undefined') return;
    const search = searchParams?.toString()
      ? `?${searchParams.toString()}`
      : window.location.search;
    if (!isSourcingResumeSearch(search)) return;
    if (!consumeSourcingResumeFromUrl()) return;
    setResumeDraft(true);
    setOpen(true);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    tryOpenFromUrl();
  }, [pathname, tryOpenFromUrl]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <SourcingRequestModal
      open={open}
      resumeDraft={resumeDraft}
      onClose={() => {
        setOpen(false);
        setResumeDraft(false);
      }}
    />
  );
}

/** Глобальный resume после auth: `?sourcing=resume` на любом маршруте витрины/ЛК. */
export function SourcingRequestResumeHost() {
  return (
    <Suspense fallback={null}>
      <SourcingRequestResumeHostInner />
    </Suspense>
  );
}
