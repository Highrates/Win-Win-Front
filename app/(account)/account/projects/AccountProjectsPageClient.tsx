'use client';

import { useEffect, useState } from 'react';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { ACCOUNT_PROJECT_NAMES } from '@/components/AccountProjectTabs/accountProjectNames';
import { Button } from '@/components/Button/Button';
import styles from './page.module.css';

const PROJECT_SECTION_TABS = [
  { id: 'all', label: 'Все' },
  { id: 'living', label: 'Гостиная' },
  { id: 'dining', label: 'Столовая' },
  { id: 'light', label: 'Свет' },
  { id: 'office', label: 'Офис' },
] as const;

const FALLBACK_PROJECT_NAMES = ['Проект'] as const;

type ProjectProduct = {
  id: string;
  name: string;
  price: string;
  color: string;
  material: string;
  size: string;
};

const PROJECT_PRODUCTS: ProjectProduct[] = [
  {
    id: '1',
    name: 'Кресло Otto Soft',
    price: '~ 185 990',
    color: 'Светло-серый',
    material: 'Массив дуба, текстиль',
    size: '82 × 76 × 90 см',
  },
  {
    id: '2',
    name: 'Диван Bergen',
    price: '~ 412 500',
    color: 'Тёмно-синий',
    material: 'Велюр, дерево',
    size: '240 × 95 × 85 см',
  },
  {
    id: '3',
    name: 'Стол обеденный Nord',
    price: '~ 89 900',
    color: 'Натуральный дуб',
    material: 'Массив дуба',
    size: '180 × 90 × 75 см',
  },
  {
    id: '4',
    name: 'Ковёр Artisan',
    price: '~ 45 200',
    color: 'Бежевый',
    material: 'Шерсть',
    size: '200 × 300 см',
  },
  {
    id: '5',
    name: 'Торшер Linea',
    price: '~ 32 400',
    color: 'Чёрный / латунь',
    material: 'Металл, стекло',
    size: 'Ø 35 см, H 165 см',
  },
];

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

function CtaAccordionChevronIcon({ open }: { open: boolean }) {
  return (
    <span className={styles.ctaAccordionChevron} data-open={open || undefined} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M11 4v14M4 11h14" />
      </svg>
    </span>
  );
}

function AccountProjectCtaDetails() {
  return (
    <>
      <div className={styles.ctaLeftInfo}>
        <div className={styles.ctaLabel}>Общая сумма:</div>
        <div className={styles.ctaCount}>(16 товаров)</div>
      </div>
      <div className={styles.ctaRightInfo}>
        <div className={styles.ctaPrice}>~ 10 185 990</div>
        <div className={styles.ctaBonus}>
          <img src="/icons/wallet-add.svg" alt="" width={16} height={16} aria-hidden />
          <span>
            <span className={styles.ctaBonusLabel}>Ожидаемый бонус: </span>
            <span className={styles.ctaBonusValue}>1 180 590 р.</span>
          </span>
        </div>
      </div>
    </>
  );
}

export function AccountProjectsPageClient() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [sectionTab, setSectionTab] = useState<(typeof PROJECT_SECTION_TABS)[number]['id']>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [ctaAccordionOpen, setCtaAccordionOpen] = useState(false);
  const isCtaAccordionLayout = useMediaQuery('(max-width: 768px)');

  const projectNames =
    Array.isArray(ACCOUNT_PROJECT_NAMES) && ACCOUNT_PROJECT_NAMES.length > 0
      ? ACCOUNT_PROJECT_NAMES
      : FALLBACK_PROJECT_NAMES;
  const projectName = projectNames[selectedIndex] ?? projectNames[0];

  const onSelectAllToggle = () => {
    if (selectionMode) {
      setSelectionMode(false);
      setSelectedIds(new Set());
    } else {
      setSelectionMode(true);
      setSelectedIds(new Set(PROJECT_PRODUCTS.map((p) => p.id)));
    }
  };

  const onProductCheckChange = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <AccountProjectTabs selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        <Button variant="primary" className={styles.createProjectButton}>
          Создать проект
        </Button>
      </div>

      <div className={styles.projectHeader}>
        <div className={styles.projectTitleRow}>
          <span className={styles.projectTitle}>{projectName}</span>
          <button type="button" className={styles.iconButton} aria-label="Редактировать проект">
            <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} />
          </button>
        </div>
        <div className={styles.projectTools}>
          <button type="button" className={styles.specLink} aria-label="Скачать спецификацию PDF">
            <img
              src="/icons/document-download.svg"
              alt=""
              width={20}
              height={20}
              className={styles.specIcon}
              aria-hidden
            />
            <span>Спецификация PDF</span>
          </button>
          <button type="button" className={styles.iconButton} aria-label="Заметки по проекту">
            <img src="/icons/note.svg" alt="" width={20} height={20} aria-hidden />
          </button>
        </div>
      </div>

      <p className={styles.projectAddress}>Адрес: ул. Красных молдавских партизан 16</p>

      {isCtaAccordionLayout ? (
        <div className={styles.ctaAccordionWrapper}>
          <div className={styles.ctaAccordion}>
            <button
              type="button"
              className={styles.ctaAccordionTrigger}
              onClick={() => setCtaAccordionOpen((o) => !o)}
              aria-expanded={ctaAccordionOpen}
              aria-controls="account-project-cta-panel"
              id="account-project-cta-trigger"
            >
              <div className={styles.ctaAccordionTriggerInner}>
                <div className={styles.ctaAccordionTriggerLeft}>
                  <div className={styles.ctaLabel}>Общая сумма:</div>
                  <div className={styles.ctaCount}>(16 товаров)</div>
                </div>
                <span className={styles.ctaAccordionTriggerPrice}>~ 10 185 990</span>
              </div>
              <CtaAccordionChevronIcon open={ctaAccordionOpen} />
            </button>
            <div
              id="account-project-cta-panel"
              role="region"
              aria-labelledby="account-project-cta-trigger"
              className={styles.ctaAccordionPanel}
              data-open={ctaAccordionOpen || undefined}
            >
              <div className={styles.ctaAccordionContent}>
                <div className={styles.ctaAccordionSnowStack}>
                  <AccountProjectCtaDetails />
                </div>
                <button type="button" className={styles.ctaCheckoutBtn}>
                  <span>Оформить</span>
                  <span aria-hidden>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.ctaRow}>
          <div className={styles.ctaSnowPanel}>
            <AccountProjectCtaDetails />
          </div>
          <button type="button" className={styles.ctaCheckoutBtn}>
            <span>Оформить</span>
            <span aria-hidden>→</span>
          </button>
        </div>
      )}

      <div
        className={`${styles.sectionTabsWrapper} ${styles.tabsOffset}`}
        role="tablist"
        aria-label="Разделы проекта"
      >
        {PROJECT_SECTION_TABS.map((tab) => {
          const isActive = tab.id === sectionTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? styles.sectionTabActive : styles.sectionTab}
              onClick={() => setSectionTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={styles.productsTopRow}>
        <div className={styles.marketSectionRowLeft}>
          <div className={styles.marketFilterGroup}>
            <button type="button" aria-label="Фильтр">
              <img src="/icons/filter.svg" alt="" width={20} height={20} />
              <span>Фильтр</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          className={styles.selectAllButton}
          onClick={onSelectAllToggle}
          aria-pressed={selectionMode}
        >
          {selectionMode ? (
            <>
              <span>Отменить</span>
              <img src="/icons/delete.svg" alt="" width={20} height={20} className={styles.iconBlack} />
            </>
          ) : (
            'Выбрать все'
          )}
        </button>
      </div>

      <div className={styles.productCardDetailedWrapper}>
        {PROJECT_PRODUCTS.map((product) => (
          <div key={product.id} className={styles.productCardDetailedRow}>
            {selectionMode ? (
              <input
                type="checkbox"
                className={styles.productCardCheckbox}
                checked={selectedIds.has(product.id)}
                onChange={(e) => onProductCheckChange(product.id, e.target.checked)}
                aria-label={`Выбрать «${product.name}»`}
              />
            ) : null}
            <div className={styles.productCardDetailed}>
              <div className={styles.productCardDetailedImageWrap}>
                <img
                  src="/images/placeholder.svg"
                  alt={product.name}
                  className={styles.productCardDetailedImage}
                />
              </div>
              <div className={styles.productCardDetailedBody}>
                <div className={styles.productCardDetailedTitleRow}>
                  <div className={styles.productCardDetailedTitleTexts}>
                    <span className={styles.productCardDetailedName}>{product.name}</span>
                    <span className={styles.productCardDetailedPrice}>
                      {product.price}
                      {'\u00A0'}₽
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.productCardDetailedTitleMore}`}
                    aria-label={`Ещё по товару: ${product.name}`}
                  >
                    <img src="/icons/more.svg" alt="" width={20} height={20} aria-hidden />
                  </button>
                </div>
                <div className={styles.productCardDetailedMeta}>
                  <div className={styles.productCardDetailedMetaItem}>
                    <span className={styles.productCardDetailedMetaLabel}>Цвет</span>
                    <span>{product.color}</span>
                  </div>
                  <div className={styles.productCardDetailedMetaItem}>
                    <span className={styles.productCardDetailedMetaLabel}>Материал</span>
                    <span>{product.material}</span>
                  </div>
                  <div className={styles.productCardDetailedMetaItem}>
                    <span className={styles.productCardDetailedMetaLabel}>Размер</span>
                    <span>{product.size}</span>
                  </div>
                </div>
                <div className={styles.productCardDetailedFooter}>
                  <div className={styles.productCardDetailedQty}>
                    <button type="button" className={styles.qtyButton} aria-label="Уменьшить количество">
                      -
                    </button>
                    <span className={styles.qtyValue}>1</span>
                    <button type="button" className={styles.qtyButton} aria-label="Увеличить количество">
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
