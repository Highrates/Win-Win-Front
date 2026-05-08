'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import styles from './ProductPage.module.css';

export type ProductOrderProjectOption = { id: string; name: string };

type ProductOrderSplitProps = {
  configurationReadyForProject: boolean;
  projects: ProductOrderProjectOption[];
  projectsLoading: boolean;
  projectActionBusy: boolean;
  onAddToExistingProject: (projectId: string) => void | Promise<void>;
  onCreateNewProject: () => void;
};

export function ProductOrderSplit({
  configurationReadyForProject,
  projects,
  projectsLoading,
  projectActionBusy,
  onAddToExistingProject,
  onCreateNewProject,
}: ProductOrderSplitProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={wrapRef} className={styles.productDetailsOrderSplit}>
      <Button variant="primary" type="button" className={styles.productDetailsBtnPrimarySegment}>
        Добавить к заказу
      </Button>
      <div className={styles.productDetailsOrderSplitDivider} aria-hidden />
      <div className={styles.productDetailsOrderChevronWrap}>
        <button
          type="button"
          className={styles.productDetailsOrderChevronBtn}
          aria-label="Добавить в проект"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={styles.productDetailsOrderChevronIcon} aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 11 7" fill="none">
              <path d="M1 1l4.5 4.5L10 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
        {menuOpen ? (
          <div className={styles.productDetailsOrderMenu} role="menu">
            {!configurationReadyForProject ? (
              <p className={styles.productDetailsOrderMenuMuted}>Выберите модификацию и материал-цвет по каждому элементу.</p>
            ) : (
              <div className={styles.productDetailsOrderMenuInner}>
                <div className={styles.productDetailsOrderMenuCol}>
                  <span className={styles.productDetailsOrderMenuHeading}>Добавить в проект</span>
                  {projectsLoading ? (
                    <span className={styles.productDetailsOrderMenuMuted}>Загрузка…</span>
                  ) : null}
                  {!projectsLoading && projects.length === 0 ? (
                    <p className={styles.productDetailsOrderMenuMuted}>
                      Проектов пока нет. Можно создать новый ниже или в{' '}
                      <Link href="/account/projects" className={styles.productDetailsOrderMenuLink}>
                        личном кабинете
                      </Link>
                      .
                    </p>
                  ) : null}
                  <ul className={styles.productDetailsOrderMenuProjectList}>
                    {projects.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          role="menuitem"
                          className={styles.productDetailsOrderMenuItem}
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
                <div className={styles.productDetailsOrderMenuFooter}>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.productDetailsOrderMenuItem}
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
