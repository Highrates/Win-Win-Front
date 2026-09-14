'use client';

import { useEffect } from 'react';
import { TRANSITION_ENTER_COMPLETE_EVENT } from '@/components/SiteTransition';

function scrollToLocationHash() {
  const raw = typeof window !== 'undefined' ? window.location.hash : '';
  const id = raw.replace(/^#/, '');
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** После SiteTransition hash часто теряется для scroll — догоняем на enter-complete и на mount. */
export function SearchHashScroll() {
  useEffect(() => {
    const run = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToLocationHash);
      });
    };
    const t = window.setTimeout(run, 40);
    const onEnter = () => {
      window.setTimeout(run, 60);
    };
    window.addEventListener(TRANSITION_ENTER_COMPLETE_EVENT, onEnter);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(TRANSITION_ENTER_COMPLETE_EVENT, onEnter);
    };
  }, []);

  return null;
}
