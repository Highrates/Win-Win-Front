'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import styles from './ProductOrderSplit.module.css';

export type ProductOrderProjectOption = { id: string; name: string };

type ProductOrderSplitProps = {
  configurationReadyForProject: boolean;
  configurationHintMessage: string;
  onConfigurationHint: () => void;
  projects: ProductOrderProjectOption[];
  projectsLoading: boolean;
  projectActionBusy: boolean;
  orderActionBusy: boolean;
  onAddToExistingProject: (projectId: string) => void | Promise<void>;
  onCreateNewProject: () => void;
  onAddToOrder: () => void | Promise<void>;
  /** После добавления в заказ — количество и ± (null = кнопка «Добавить к заказу»). */
  orderQuantity?: number | null;
  onOrderQuantityDelta?: (delta: number) => void | Promise<void>;
  /** Lazy-load списка проектов при первом открытии меню. */
  onMenuOpenChange?: (open: boolean) => void;
  /** Компактный вид в mobile sticky bar. */
  inStickyBar?: boolean;
  /** Меню открывается вверх (sticky bar у нижнего края экрана). */
  menuOpensAbove?: boolean;
};

export function ProductOrderSplit({
  configurationReadyForProject,
  configurationHintMessage,
  onConfigurationHint,
  projects,
  projectsLoading,
  projectActionBusy,
  orderActionBusy,
  onAddToExistingProject,
  onCreateNewProject,
  onAddToOrder,
  orderQuantity = null,
  onOrderQuantityDelta,
  onMenuOpenChange,
  inStickyBar = false,
  menuOpensAbove = false,
}: ProductOrderSplitProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMenuOpenChange?.(menuOpen);
  }, [menuOpen, onMenuOpenChange]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const rootClass = [styles.root, inStickyBar ? styles.inStickyBar : ''].filter(Boolean).join(' ');
  const menuClass = [styles.menu, menuOpensAbove ? styles.menuOpensAbove : ''].filter(Boolean).join(' ');
  const showOrderQty = orderQuantity != null && orderQuantity > 0;

  const requestConfigurationHint = () => {
    if (configurationHintMessage) onConfigurationHint();
  };

  const handleAddToOrderClick = () => {
    if (!configurationReadyForProject) {
      requestConfigurationHint();
      return;
    }
    void onAddToOrder();
  };

  const handleProjectMenuToggle = () => {
    if (!menuOpen && !configurationReadyForProject) {
      requestConfigurationHint();
    }
    setMenuOpen((o) => !o);
  };

  return (
    <div ref={wrapRef} className={rootClass}>
      {showOrderQty ? (
        <div className={styles.qtyPrimary} aria-live="polite">
          <button
            type="button"
            className={styles.qtyBtn}
            aria-label="Уменьшить количество"
            disabled={orderActionBusy || !onOrderQuantityDelta}
            onClick={() => void onOrderQuantityDelta?.(-1)}
          >
            −
          </button>
          <span className={styles.qtyValue}>
            {orderQuantity}
            {'\u00A0'}
            шт
          </span>
          <button
            type="button"
            className={styles.qtyBtn}
            aria-label="Увеличить количество"
            disabled={orderActionBusy || !onOrderQuantityDelta}
            onClick={() => void onOrderQuantityDelta?.(1)}
          >
            +
          </button>
        </div>
      ) : (
        <Button
          variant="primary"
          type="button"
          className={styles.primaryBtn}
          disabled={orderActionBusy}
          onClick={handleAddToOrderClick}
        >
          Добавить к заказу
        </Button>
      )}
      <div className={styles.divider} aria-hidden />
      <div className={styles.chevronWrap}>
        <button
          type="button"
          className={styles.chevronBtn}
          aria-label="Добавить в проект"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={handleProjectMenuToggle}
        >
          <span className={styles.chevronIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 11 7" fill="none">
              <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
        {menuOpen ? (
          <div className={menuClass} role="menu">
            {!configurationReadyForProject ? (
              <p className={styles.menuMuted}>
                {configurationHintMessage || 'Выберите модификацию и материал-цвет по каждому элементу.'}
              </p>
            ) : (
              <div className={styles.menuInner}>
                <div className={styles.menuCol}>
                  <span className={styles.menuHeading}>Добавить в проект</span>
                  {projectsLoading ? (
                    <span className={styles.menuMuted}>Загрузка…</span>
                  ) : null}
                  {!projectsLoading && projects.length === 0 ? (
                    <p className={styles.menuMuted}>
                      Проектов пока нет. Можно создать новый ниже или в{' '}
                      <Link href="/account/projects" className={styles.menuLink}>
                        личном кабинете
                      </Link>
                      .
                    </p>
                  ) : null}
                  <ul className={styles.menuProjectList}>
                    {projects.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          role="menuitem"
                          className={styles.menuItem}
                          disabled={projectActionBusy}
                          onClick={() => {
                            void onAddToExistingProject(p.id);
                            setMenuOpen(false);
                          }}
                        >
                          {p.name.trim() || 'Без названия'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.menuFooter}>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    disabled={projectActionBusy}
                    onClick={() => {
                      onCreateNewProject();
                      setMenuOpen(false);
                    }}
                  >
                    Новый проект…
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
