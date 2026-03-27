'use client';

import { useState, useCallback, useEffect } from 'react';
import styles from './DesignerPage.module.css';

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

type Designer = {
  name: string;
  city: string;
  services: string;
};

type Props = {
  designer: Designer;
  linkClassName: string;
  textClassName: string;
  arrowClassName: string;
};

export function MoreAboutDesignerModal({ designer, linkClassName, textClassName, arrowClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const openModal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
    setFullscreen(false);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setFullscreen(false);
  }, []);

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
  }, [open, closeModal]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={openModal}
        className={linkClassName}
        aria-label="Еще о дизайнере"
      >
        <span className={textClassName}>Еще о дизайнере</span>
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
        aria-labelledby="designer-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <span id="designer-modal-title" className={styles.srOnly}>
            Еще о дизайнере
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
            <div className={`${styles.richContent} rich-content`}>
              <h2>О дизайнере</h2>
              <p>
                {designer.name}, {designer.city}. {designer.services && `Услуги: ${designer.services}.`} Опыт работы с частными и коммерческими интерьерами.
              </p>
              <div>
                <img src="/images/placeholder.svg" alt="" width={640} height={360} />
              </div>
              <h3>Подход к проектам</h3>
              <p>
                Индивидуальный подход к каждому заказчику, подбор материалов и мебели под бюджет и стиль. Полное ведение проекта от концепции до авторского надзора.
              </p>
              <h3>Портфолио</h3>
              <p>
                В портфолио представлены реализованные проекты квартир, домов и коммерческих пространств. Сотрудничество с ведущими брендами мебели и отделочных материалов.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
