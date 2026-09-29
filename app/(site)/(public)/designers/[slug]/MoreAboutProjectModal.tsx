'use client';

import { useState, useCallback, useEffect, useId, useMemo } from 'react';
import { ProductCardSmall } from '@/components/ProductCardSmall';
import { SideSheetModal } from '@/components/SideSheetModal/SideSheetModal';
import type { LikesBulkUiState } from '@/lib/likesBulkUi';
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
  qaMessageCount: number;
};

type Project = {
  title: string;
  places: string;
  /** Санитизированный HTML из RichBlock кейса */
  descriptionHtml: string | null;
  products: ProjectProduct[];
  /** Обложки кейса для галереи в модалке */
  coverImages?: string[];
};

type Props = {
  project: Project;
  linkClassName: string;
  textClassName: string;
  arrowClassName: string;
  /** Управляемый режим (например открытие с обложки в сетке): кнопка «Подробнее» не рендерится в этом экземпляре. */
  controlledOpen?: boolean;
  onClose?: () => void;
  /** Bulk-лайки товаров со страницы (сетка / список) — чтобы модалка не теряла состояние. */
  productLikesBulkFor?: (productId: string | undefined) => LikesBulkUiState | undefined;
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

function projectCoverImages(project: Project): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of project.coverImages ?? []) {
    const url = raw.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

export function MoreAboutProjectModal({
  project,
  linkClassName,
  textClassName,
  arrowClassName,
  controlledOpen,
  onClose,
  productLikesBulkFor,
}: Props) {
  const productsPanelId = useId();
  const productsTriggerId = useId();
  const [open, setOpen] = useState(false);
  const [panelId, setPanelId] = useState<string | undefined>();
  const hasProducts = project.products.length > 0;
  const [accordionOpen, setAccordionOpen] = useState(hasProducts);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const covers = useMemo(() => projectCoverImages(project), [project]);
  const hasDescription = Boolean(project.descriptionHtml?.trim());

  const closeModal = useCallback(() => {
    if (isControlled) onClose?.();
    else setOpen(false);
  }, [isControlled, onClose]);

  const openModal = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isControlled) {
        setOpen(true);
        setAccordionOpen(project.products.length > 0);
      }
    },
    [isControlled, project.products.length],
  );

  useEffect(() => {
    if (!isOpen) return;
    setAccordionOpen(project.products.length > 0);
  }, [isOpen, project.title, project.products.length]);

  return (
    <>
      {!isControlled ? (
        <button
          type="button"
          onClick={openModal}
          className={linkClassName}
          aria-label="Подробнее о проекте"
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className={textClassName}>Подробнее о проекте</span>
          <img src="/icons/arrow-right.svg" alt="" width={12} height={7} className={arrowClassName} />
        </button>
      ) : null}
      <SideSheetModal
        open={isOpen}
        onClose={closeModal}
        title={project.title}
        srTitle={project.title}
        onPanelId={setPanelId}
      >
        <>
          {covers.length > 0 ? (
            <div className={styles.modalCoverGallery} aria-label="Обложки проекта">
              {covers.map((url, i) => (
                <img
                  key={url}
                  src={url}
                  alt={`Обложка проекта «${project.title}»${covers.length > 1 ? `, ${i + 1}` : ''}`}
                  className={styles.modalCoverImg}
                />
              ))}
            </div>
          ) : null}
          {project.places.trim() ? (
            <p className={styles.modalProjectPlaces}>{project.places}</p>
          ) : null}
          <div className={styles.modalAccordionsOuter}>
            <div className={styles.modalAccordionsWrapper}>
              <div className={styles.modalAccordion}>
                <button
                  type="button"
                  className={styles.modalAccordionTrigger}
                  onClick={() => setAccordionOpen((v) => !v)}
                  aria-expanded={accordionOpen}
                  aria-controls={productsPanelId}
                  id={productsTriggerId}
                >
                  <div className={styles.modalAccordionTriggerInner}>
                    <img
                      src="/icons/3d-square.svg"
                      alt=""
                      width={20}
                      height={20}
                      className={styles.modalAccordionIcon}
                      aria-hidden
                    />
                    <span className={styles.modalAccordionTitle}>
                      Товары проекта
                      {project.products.length > 0 ? ` · ${project.products.length}` : ''}
                    </span>
                  </div>
                  <AccordionChevronIcon open={accordionOpen} />
                </button>
                <div
                  id={productsPanelId}
                  role="region"
                  aria-labelledby={productsTriggerId}
                  className={styles.modalAccordionPanel}
                  data-open={accordionOpen || undefined}
                >
                  <div className={styles.modalAccordionContent}>
                    <div className={styles.modalProjectProductsList}>
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
                            qaMessageCount={p.qaMessageCount}
                            productLikesBulk={productLikesBulkFor?.(p.productId)}
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
          <div className={`${styles.richContent} ${styles.modalDescriptionBlock} rich-content`}>
            {hasDescription ? (
              <div dangerouslySetInnerHTML={{ __html: project.descriptionHtml! }} />
            ) : covers.length > 0 ? (
              <div className={styles.modalCoverFallback}>
                <p className={styles.modalProjectNoDescription}>
                  Текстового описания пока нет — смотрите фотографии проекта выше.
                </p>
              </div>
            ) : (
              <p className={styles.modalProjectNoDescription}>Описание проекта пока не добавлено.</p>
            )}
          </div>
        </>
      </SideSheetModal>
    </>
  );
}
