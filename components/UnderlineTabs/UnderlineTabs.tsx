'use client';

import Link from 'next/link';
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import styles from './UnderlineTabs.module.css';

export type UnderlineTabItem = {
  id: string;
  label: ReactNode;
  /** Если задан — рендер как ссылка (URL-навигация). */
  href?: string;
  /** Доп. атрибуты кнопки/ссылки (`id`, `aria-controls`, …). */
  buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'type' | 'className' | 'onClick' | 'onMouseEnter' | 'children' | 'href'
  >;
};

type Props = {
  tabs: UnderlineTabItem[];
  activeId: string;
  /** Для button-табов без `href`. */
  onSelect?: (id: string) => void;
  ariaLabel: string;
  className?: string;
  /** `tablist` (по умолчанию) или обычная навигация без role=tab. */
  asTablist?: boolean;
};

/**
 * Горизонтальные табы по центру со скользящей линией (как ScrollCatalog).
 * Неактивный — `--color-gray`, линия — `--account-hairline-width`.
 */
export function UnderlineTabs({
  tabs,
  activeId,
  onSelect,
  ariaLabel,
  className,
  asTablist = true,
}: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const tabsWrapperRef = useRef<HTMLElement>(null);
  const tabBtnRefs = useRef(new Map<string, HTMLElement>());
  const indicatorTarget = hoverId ?? activeId;

  const updateIndicator = useCallback(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const btn = tabBtnRefs.current.get(indicatorTarget);
    if (!btn) {
      wrap.style.setProperty('--tabs-indicator-x', '0px');
      wrap.style.setProperty('--tabs-indicator-w', '0px');
      return;
    }
    wrap.style.setProperty('--tabs-indicator-x', `${Math.max(0, btn.offsetLeft)}px`);
    wrap.style.setProperty('--tabs-indicator-w', `${Math.max(0, btn.offsetWidth)}px`);
  }, [indicatorTarget]);

  useLayoutEffect(() => {
    updateIndicator();
    const t = window.setTimeout(updateIndicator, 0);
    return () => window.clearTimeout(t);
  }, [updateIndicator, activeId, hoverId, tabs]);

  useLayoutEffect(() => {
    const wrap = tabsWrapperRef.current;
    if (!wrap) return;
    const sync = () => updateIndicator();
    const ro = new ResizeObserver(sync);
    ro.observe(wrap);
    wrap.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      wrap.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [updateIndicator]);

  if (!tabs.length) return null;

  const wrapClass = className ? `${styles.tabsWrapper} ${className}` : styles.tabsWrapper;

  const setTabRef = (id: string, el: HTMLElement | null) => {
    if (!el) tabBtnRefs.current.delete(id);
    else tabBtnRefs.current.set(id, el);
  };

  return (
    <nav
      className={wrapClass}
      aria-label={ariaLabel}
      role={asTablist ? 'tablist' : undefined}
      ref={tabsWrapperRef}
      onMouseLeave={() => setHoverId(null)}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const classNameTab = isActive ? styles.tabActive : styles.tab;
        const { role: btnRole, ...restButtonProps } = tab.buttonProps ?? {};
        if (tab.href) {
          const { id, 'aria-controls': ariaControls } = restButtonProps;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={classNameTab}
              onMouseEnter={() => setHoverId(tab.id)}
              ref={(el) => setTabRef(tab.id, el)}
              id={id}
              aria-controls={ariaControls}
              role={asTablist ? (btnRole ?? 'tab') : btnRole}
              aria-selected={asTablist ? isActive : undefined}
              aria-current={!asTablist && isActive ? 'page' : undefined}
            >
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            className={classNameTab}
            onClick={() => onSelect?.(tab.id)}
            onMouseEnter={() => setHoverId(tab.id)}
            ref={(el) => setTabRef(tab.id, el)}
            role={asTablist ? (btnRole ?? 'tab') : btnRole}
            aria-selected={asTablist ? isActive : undefined}
            aria-current={!asTablist && isActive ? 'page' : undefined}
            {...restButtonProps}
          >
            {tab.label}
          </button>
        );
      })}
      <span className={styles.tabsIndicator} aria-hidden="true" />
    </nav>
  );
}
