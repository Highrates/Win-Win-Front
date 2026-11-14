'use client';

import type { Dispatch, SetStateAction } from 'react';
import { AdminCompactBtn } from '@/components/AdminCompactBtn/AdminCompactBtn';
import { AdminTableRemoveButton } from '@/components/admin/AdminTableRemoveButton/AdminTableRemoveButton';
import {
  ProductGalleryEditor,
  type ProductGalleryFrame,
} from '@/components/admin/ProductGalleryEditor/ProductGalleryEditor';
import { AdminTextField } from '@/components/AdminTextField/AdminTextField';
import { RichBlock } from '@/components/RichBlock/RichBlock';
import catalogStyles from '@/app/(admin)/admin/catalogAdmin.module.css';
import pn from '@/app/(admin)/admin/(shell)/catalog/products/new/productNew.module.css';
import type { adminProductGalleryEditorStrings } from '@/lib/admin-i18n/adminProductGalleryEditorI18n';
import { emptyScheduleItem, type EditorDay } from './tourEditorHelpers';
import styles from './toursAdmin.module.css';

type GalleryStrings = ReturnType<typeof adminProductGalleryEditorStrings>;

function CollapseChevron({ open }: { open: boolean }) {
  return (
    <span
      className={`${styles.dayToggleChevron}${open ? ` ${styles.dayToggleChevronOpen}` : ''}`}
      aria-hidden
    >
      <svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2 3.5L5 6.5L8 3.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type Props = {
  days: EditorDay[];
  setDays: Dispatch<SetStateAction<EditorDay[]>>;
  dayCollapsed: boolean[];
  itemCollapsed: boolean[][];
  setItemCollapsed: Dispatch<SetStateAction<boolean[][]>>;
  daySelectedIds: string[][];
  gallery: ProductGalleryFrame[];
  galleryStr: GalleryStrings;
  onToggleDayCollapsed: (di: number) => void;
  onToggleItemCollapsed: (di: number, ii: number) => void;
  onRemoveDay: (di: number) => void;
  onRemoveItem: (di: number, ii: number) => void;
  onDaySelectedChange: (di: number, ids: string[]) => void;
  onAddDay: () => void;
};

export function TourEditorDaysSection({
  days,
  setDays,
  dayCollapsed,
  itemCollapsed,
  setItemCollapsed,
  daySelectedIds,
  gallery,
  galleryStr,
  onToggleDayCollapsed,
  onToggleItemCollapsed,
  onRemoveDay,
  onRemoveItem,
  onDaySelectedChange,
  onAddDay,
}: Props) {
  return (
    <div className={pn.section}>
      <div className={styles.daysSectionHeader}>
        <h2 className={catalogStyles.groupHeading} style={{ margin: 0 }}>
          Дни программы
        </h2>
        <AdminCompactBtn type="button" onClick={onAddDay}>
          Добавить день
        </AdminCompactBtn>
      </div>

      {days.map((day, di) => {
        const collapsed = dayCollapsed[di] ?? false;
        const summary = [day.title, day.subtitle].filter(Boolean).join(' · ');
        return (
          <div key={day.clientKey} className={styles.dayCard}>
            <div className={styles.dayHeader}>
              <div className={styles.dayHeaderMain}>
                <button
                  type="button"
                  className={styles.dayToggle}
                  aria-expanded={!collapsed}
                  onClick={() => onToggleDayCollapsed(di)}
                >
                  <CollapseChevron open={!collapsed} />
                  <span className={styles.dayHeaderTitle}>День {di + 1}</span>
                  {collapsed && summary ? (
                    <span className={styles.dayHeaderSummary}>{summary}</span>
                  ) : null}
                </button>
              </div>
              <div className={styles.dayHeaderActions}>
                <AdminTableRemoveButton
                  label="Удалить день"
                  onClick={() => void onRemoveDay(di)}
                />
              </div>
            </div>

            {!collapsed ? (
              <>
                <div className={styles.row2}>
                  <AdminTextField
                    label="Заголовок дня"
                    value={day.title}
                    placeholder="ПРИБЫТИЕ"
                    onChange={(e) =>
                      setDays((prev) =>
                        prev.map((d, i) => (i === di ? { ...d, title: e.target.value } : d)),
                      )
                    }
                  />
                  <AdminTextField
                    label="Подзаголовок"
                    value={day.subtitle}
                    onChange={(e) =>
                      setDays((prev) =>
                        prev.map((d, i) =>
                          i === di ? { ...d, subtitle: e.target.value } : d,
                        ),
                      )
                    }
                  />
                </div>

                {day.items.map((it, ii) => {
                  const itemClosed = itemCollapsed[di]?.[ii] ?? false;
                  return (
                    <div key={it.clientKey} className={styles.itemBlock}>
                      <div
                        className={`${styles.itemHeader}${itemClosed ? '' : ` ${styles.itemHeaderExpanded}`}`}
                      >
                        {itemClosed ? (
                          <button
                            type="button"
                            className={styles.itemToggle}
                            aria-expanded={false}
                            onClick={() => onToggleItemCollapsed(di, ii)}
                          >
                            <CollapseChevron open={false} />
                            <span className={styles.itemCollapsedSummary}>
                              {it.timeLabel ? (
                                <span className={styles.itemCollapsedTime}>{it.timeLabel}</span>
                              ) : null}
                              <span className={styles.itemCollapsedTitle}>
                                {it.title || 'Пункт расписания'}
                              </span>
                            </span>
                          </button>
                        ) : (
                          <div className={styles.itemFields}>
                            <button
                              type="button"
                              className={styles.itemToggle}
                              aria-expanded
                              onClick={() => onToggleItemCollapsed(di, ii)}
                            >
                              <CollapseChevron open />
                              <span className={styles.itemCollapsedTitle}>Пункт {ii + 1}</span>
                            </button>
                            <div className={styles.itemRow}>
                              <AdminTextField
                                value={it.timeLabel}
                                placeholder="9:00"
                                aria-label="Время"
                                onChange={(e) =>
                                  setDays((prev) =>
                                    prev.map((d, i) =>
                                      i === di
                                        ? {
                                            ...d,
                                            items: d.items.map((x, j) =>
                                              j === ii
                                                ? { ...x, timeLabel: e.target.value }
                                                : x,
                                            ),
                                          }
                                        : d,
                                    ),
                                  )
                                }
                              />
                              <AdminTextField
                                value={it.title}
                                placeholder="Заголовок пункта"
                                aria-label="Заголовок пункта"
                                onChange={(e) =>
                                  setDays((prev) =>
                                    prev.map((d, i) =>
                                      i === di
                                        ? {
                                            ...d,
                                            items: d.items.map((x, j) =>
                                              j === ii ? { ...x, title: e.target.value } : x,
                                            ),
                                          }
                                        : d,
                                    ),
                                  )
                                }
                              />
                            </div>
                            <RichBlock
                              value={it.body}
                              onChange={(html) =>
                                setDays((prev) =>
                                  prev.map((d, i) =>
                                    i === di
                                      ? {
                                          ...d,
                                          items: d.items.map((x, j) =>
                                            j === ii ? { ...x, body: html } : x,
                                          ),
                                        }
                                      : d,
                                  ),
                                )
                              }
                              placeholder="Описание пункта"
                              allowMedia={false}
                            />
                          </div>
                        )}
                        <div className={styles.itemRemove}>
                          <AdminTableRemoveButton
                            label="Удалить пункт"
                            onClick={() => void onRemoveItem(di, ii)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <AdminCompactBtn
                  type="button"
                  onClick={() => {
                    setDays((prev) =>
                      prev.map((d, i) =>
                        i === di
                          ? {
                              ...d,
                              items: [...d.items, emptyScheduleItem()],
                            }
                          : d,
                      ),
                    );
                    setItemCollapsed((prev) =>
                      prev.map((row, i) => (i === di ? [...row, false] : row)),
                    );
                  }}
                >
                  Пункт расписания
                </AdminCompactBtn>

                <div>
                  <h3 className={catalogStyles.groupHeading}>Фото дня</h3>
                  <ProductGalleryEditor
                    mode="subset"
                    pool={gallery}
                    selectedIds={daySelectedIds[di] ?? []}
                    onSelectedIdsChange={(ids) => onDaySelectedChange(di, ids)}
                    strings={galleryStr}
                  />
                </div>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}