'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import { ProductCardSmall } from '@/components/ProductCardSmall';
import styles from './DesignerPage.module.css';

export type ProjectProduct = {
  /** id товара в каталоге — для ссылки «коллекции» → /projects?product= */
  productId?: string;
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
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
  /** Санитизированный HTML из RichBlock кейса */
  descriptionHtml: string | null;
  products: ProjectProduct[];
};

type Props = {
  project: Project;
  linkClassName: string;
  textClassName: string;
  arrowClassName: string;
  /** Управляемый режим (например открытие с обложки в сетке): кнопка «Подробнее» не рендерится в этом экземпляре. */
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
  const dialogId = useId();
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
    if (!isOpen) return;
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

  return (
    <>
      {!isControlled ? (
        <button
          type="button"
          onClick={openModal}
          className={linkClassName}
          aria-label="Подробнее о проекте"
          aria-expanded={isOpen}
          aria-controls={isOpen ? dialogId : undefined}
          tabIndex={isOpen ? -1 : 0}
          style={{ visibility: isOpen ? 'hidden' : 'visible' }}
        >
          <span className={textClassName}>Подробнее о проекте</span>
          <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={arrowClassName} />
        </button>
      ) : null}
      {!isOpen ? null : (
        <>
          <div
            className={styles.modalBackdrop}
            onClick={closeModal}
            role="presentation"
            aria-hidden
          />
          <div
            id={dialogId}
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
                <div className={styles.modalAccordionsOuter}>
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
                            {project.products.length > 0 ? (
                              project.products.map((p) => (
                                <ProductCardSmall
                                  key={p.productId ?? p.slug}
                                  slug={p.slug}
                                  name={p.name}
                                  price={p.price}
                                  imageUrl={p.imageUrl}
                                  productId={p.productId}
                                  collections={p.collections}
                                  likes={p.likes}
                                  comments={p.comments}
                                />
                              ))
                            ) : (
                              <p className={styles.modalProjectProductsEmpty}>Список товаров пуст</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`${styles.richContent} rich-content`}>
                  {project.descriptionHtml?.trim() ? (
                    <div dangerouslySetInnerHTML={{ __html: project.descriptionHtml }} />
                  ) : (
                    <p className={styles.modalProjectNoDescription}>Дизайнер пока не добавил подробное описание проекта.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
