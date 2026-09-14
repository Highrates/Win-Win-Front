'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function focusablesIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  );
}

export function motionMs(full: number): number {
  if (typeof window === 'undefined') return full;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : full;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export type UseOverlayPanelArgs = {
  open: boolean;
  closing: boolean;
  onClose: () => void;
  autoFocus?: boolean;
  /** @default true */
  trapTab?: boolean;
  /** @default true — search panel handles Escape itself */
  handleEscape?: boolean;
  /** @default true */
  enableContentReveal?: boolean;
  onEscape?: () => void;
};

export type UseOverlayPanelResult = {
  panelRef: RefObject<HTMLDivElement | null>;
  panelVisible: boolean;
  contentRevealed: boolean;
};

/**
 * Shared behaviour for slide-down overlay panels (search, desktop menu, super menu):
 * content reveal, inert, optional Tab trap / Escape / autofocus.
 */
export function useOverlayPanel({
  open,
  closing,
  onClose,
  autoFocus = false,
  trapTab = true,
  handleEscape = true,
  enableContentReveal = true,
  onEscape,
}: UseOverlayPanelArgs): UseOverlayPanelResult {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelVisible = open || closing;
  const [contentRevealed, setContentRevealed] = useState(false);
  const onCloseRef = useRef(onClose);
  const onEscapeRef = useRef(onEscape);
  onCloseRef.current = onClose;
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!enableContentReveal) {
      setContentRevealed(false);
      return;
    }
    if (!open || closing) {
      setContentRevealed(false);
      return;
    }
    if (prefersReducedMotion()) {
      setContentRevealed(true);
      return;
    }
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setContentRevealed(true));
    });
    return () => cancelAnimationFrame(rafId);
  }, [open, closing, enableContentReveal]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (open && !closing) {
      panel.removeAttribute('inert');
      return;
    }
    /* Перед inert уводим фокус из панели (на closing open уже false) */
    const active = document.activeElement;
    if (active instanceof HTMLElement && panel.contains(active)) {
      active.blur();
    }
    panel.setAttribute('inert', '');
  }, [open, closing, panelVisible]);

  useEffect(() => {
    if (!autoFocus || !open || closing) return;
    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      focusablesIn(panel)[0]?.focus();
    }, 80);
    return () => window.clearTimeout(t);
  }, [autoFocus, open, closing]);

  useEffect(() => {
    if (!panelVisible || !open) return;
    if (!handleEscape && !trapTab) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (handleEscape && e.key === 'Escape') {
        e.preventDefault();
        (onEscapeRef.current ?? onCloseRef.current)();
        return;
      }

      if (!trapTab || e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const items = focusablesIn(panel);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [panelVisible, open, trapTab, handleEscape]);

  return { panelRef, panelVisible, contentRevealed };
}
