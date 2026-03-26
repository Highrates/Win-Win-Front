'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button/Button';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import { CASES } from '@/lib/account/cases';
import styles from './page.module.css';

export function AccountCasesPageClient() {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);

  const onSelectAllToggle = () => {
    setSelectionMode((prev) => !prev);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <SearchBox placeholder="Поиск кейса" ariaLabel="Поиск кейса" className={styles.caseSearchBox} />
        <Button variant="primary" onClick={() => router.push('/account/cases/new')}>
          +Добавить кейс
        </Button>
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
