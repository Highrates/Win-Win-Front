'use client';

import { useState, useCallback, useEffect } from 'react';
import { ProductCardSmall } from '@/components/ProductCardSmall';
import styles from './DesignerPage.module.css';

export type ProjectProduct = {
  slug: string;
  name: string;
  price: number;
  collections: number;
  likes: number;
  comments: number;
};

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExpIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M3.75 9.25V3.75H9.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.25 12.75V18.25H12.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66678 4.66665L9.55566 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.4441 12.4444L17.333 17.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M9.25 18.25V12.75H3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.75 3.75V9.25H18.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.333 17.3333L12.4444 12.4444" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.66699 4.66665L9.55588 9.55554" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Project = {
  title: string;
  places: string;
  description: string;
  products: ProjectProduct[];
};

type Props = {
  project: Project;
  linkClassName: string;
  textClassName: string;
  arrowClassName: string;
  /** Controlled: open from parent (e.g. cover click). When set, no trigger button is rendered. */
  controlledOpen?: boolean;
  onClose?: () => void;
};

function AccordionChevronIcon({ open }: { open: boolean }) {
  return (
    <span className={styles.modalAccordionChevron} data-open={open || undefined} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M11 4v14M4 11h14" />
      </svg>
    </span>
  );
}

export function MoreAboutProjectModal({ project, linkClassName, textClassName, arrowClassName, controlledOpen, onClose }: Props) {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const closeModal = useCallback(() => {
    if (isControlled) onClose?.();
    else setOpen(false);
    setFullscreen(false);
  }, [isControlled, onClose]);

  const openModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!isControlled) {
      setOpen(true);
      setFullscreen(false);
    }
  }, [isControlled]);

  const toggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setFullscreen((v) => !v);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKeyDown);
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [isOpen, closeModal]);

  if (!isOpen) {
    if (isControlled) return null;
    return (
      <button
        type="button"
        onClick={openModal}
        className={linkClassName}
        aria-label="Подробнее о проекте"
      >
        <span className={textClassName}>Подробнее о проекте</span>
        <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={arrowClassName} />
      </button>
    );
  }

  return (
    <>
      <div
        className={styles.modalBackdrop}
        onClick={closeModal}
        role="presentation"
        aria-hidden
      />
      <div
        className={`${styles.modalPanel} ${fullscreen ? styles.modalPanelFullscreen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <span id="project-modal-title" className={styles.srOnly}>
            Подробнее о проекте
          </span>
          <div className={`padding-global ${styles.modalHeaderPadding}`}>
            <button
              type="button"
              className={styles.modalIconBtn}
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Выйти из полноэкранного режима' : 'Открыть во весь экран'}
            >
              {fullscreen ? <CollapseIcon /> : <ExpIcon />}
            </button>
            <button
              type="button"
              className={styles.modalIconBtn}
              onClick={closeModal}
              aria-label="Закрыть"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <div className={styles.modalContent}>
          <div className="padding-global">
            <h1 className={styles.modalProjectTitle}>{project.title}</h1>
            <p className={styles.modalProjectPlaces}>{project.places}</p>
            <div className={styles.modalAccordionsWrapper}>
              <div className={styles.modalAccordion}>
                <button
                  type="button"
                  className={styles.modalAccordionTrigger}
                  onClick={() => setAccordionOpen((v) => !v)}
                  aria-expanded={accordionOpen}
                  aria-controls="project-products-panel"
                  id="project-products-trigger"
                >
                  <div className={styles.modalAccordionTriggerInner}>
                    <img src="/icons/3d-square.svg" alt="" width={20} height={20} className={styles.modalAccordionIcon} aria-hidden />
                    <span className={styles.modalAccordionTitle}>Товары проекта</span>
                  </div>
                  <AccordionChevronIcon open={accordionOpen} />
                </button>
                <div
                  id="project-products-panel"
                  role="region"
                  aria-labelledby="project-products-trigger"
                  className={styles.modalAccordionPanel}
                  data-open={accordionOpen || undefined}
                >
                  <div className={styles.modalAccordionContent}>
                    <div className={styles.modalProjectProductsScroll}>
                      {project.products.map((p) => (
                        <ProductCardSmall
                          key={p.slug}
                          slug={p.slug}
                          name={p.name}
                          price={p.price}
                          collections={p.collections}
                          likes={p.likes}
                          comments={p.comments}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.richContent}>
              <p className={styles.richContentLead}>{project.description}</p>
              <div className={styles.richContentImageWrap}>
                <img src="/images/placeholder.svg" alt="" width={640} height={360} className={styles.richContentImage} />
              </div>
              <h3 className={styles.richContentH3}>Концепция</h3>
              <p className={styles.richContentText}>
                Интерьер в светлых тонах с акцентом на натуральные материалы и функциональную мебель. Подбор предметов по стилю и бюджету заказчика.
              </p>
              <h3 className={styles.richContentH3}>Реализация</h3>
              <p className={styles.richContentText}>
                Полный цикл работ: проектирование, комплектация, подбор мебели и отделки, авторский надзор. Срок реализации — 4 месяца.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
