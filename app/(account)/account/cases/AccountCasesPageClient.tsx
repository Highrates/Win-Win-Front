'use client';

import { useState } from 'react';
import { Button } from '@/components/Button/Button';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import styles from './page.module.css';

type CaseItem = {
  id: string;
  title: string;
  roomType: string;
  description: string;
  likes: number;
  messages: number;
};

const CASES: CaseItem[] = [
  {
    id: '1',
    title: 'Скандинавская гостиная',
    roomType: 'Гостиная',
    description: 'Светлый интерьер с акцентом на натуральные материалы и мягкий сценарий освещения.',
    likes: 24,
    messages: 6,
  },
  {
    id: '2',
    title: 'Современная кухня-столовая',
    roomType: 'Кухня',
    description: 'Функциональная планировка с островом, теплыми текстурами и акцентным светом.',
    likes: 18,
    messages: 4,
  },
  {
    id: '3',
    title: 'Спальня в мягких тонах',
    roomType: 'Спальня',
    description: 'Спокойная палитра, тактильные материалы и многосценарное освещение для отдыха.',
    likes: 31,
    messages: 9,
  },
];

export function AccountCasesPageClient() {
  const [selectionMode, setSelectionMode] = useState(false);

  const onSelectAllToggle = () => {
    setSelectionMode((prev) => !prev);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <SearchBox placeholder="Поиск кейса" ariaLabel="Поиск кейса" className={styles.caseSearchBox} />
        <Button variant="primary">+Добавить кейс</Button>
      </div>

      <div className={styles.productsTopRowOrders}>
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

      <div className={styles.casesList}>
        {CASES.map((item) => (
          <div key={item.id} className={styles.casesWrapper}>
            {selectionMode ? (
              <input
                type="checkbox"
                className={styles.caseCheckbox}
                aria-label={`Выбрать кейс «${item.title}»`}
              />
            ) : null}
            <div className={styles.casesWrapperInner}>
              <div className={styles.caseHead}>
                <div className={styles.caseTitle}>{item.title}</div>
                <div className={styles.caseMeta}>{item.roomType}</div>
              </div>
              <div className={styles.caseDescription}>{item.description}</div>
              <div className={styles.interactWrapper}>
                <div className={styles.interactItem}>
                  <img src="/icons/heart.svg" alt="" className={styles.interactIcon} aria-hidden />
                  <span className={styles.interactValue}>{item.likes}</span>
                </div>
                <div className={styles.interactItem}>
                  <img src="/icons/message.svg" alt="" className={styles.interactIcon} aria-hidden />
                  <span className={styles.interactValue}>{item.messages}</span>
                </div>
              </div>
            </div>

            <button type="button" className={styles.editCaseButton}>
              <img src="/icons/edit.svg" alt="" width={16} height={16} aria-hidden />
              <span>Редактировать кейс</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
