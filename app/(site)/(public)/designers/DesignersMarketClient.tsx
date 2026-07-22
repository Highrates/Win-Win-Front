'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { DesignersListClient } from '@/app/(site)/(public)/designers/DesignersListClient';
import type { DesignersListItem } from '@/app/(site)/(public)/designers/DesignersCardsClient';
import { AccountCheckbox } from '@/components/AccountProductList/AccountCheckbox';
import { AdminPillChip, AdminPillChipList } from '@/components/AdminPillChip/AdminPillChip';
import {
  CATALOG_SORT_OPTIONS,
  catalogSortLabel,
  type CatalogSortId,
} from '@/lib/catalog/catalogSort';
import { formatCatalogProductCount } from '@/lib/catalog/formatCatalogProductCount';
import { DEFAULT_SERVICE_OPTIONS } from '@/app/(site)/(account)/account/profile/profileFormUtils';
import catStyles from '@/app/(site)/(public)/categories/CategoryPage.module.css';

type Props = {
  initialItems: DesignersListItem[];
  initialTotal: number;
  query: string;
  serviceOptions?: string[];
};

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function DesignersMarketClient({
  initialItems,
  initialTotal,
  query,
  serviceOptions,
}: Props) {
  const services = useMemo(() => {
    const fromSettings = (serviceOptions ?? []).map((s) => s.trim()).filter(Boolean);
    return fromSettings.length ? fromSettings : [...DEFAULT_SERVICE_OPTIONS];
  }, [serviceOptions]);

  const [total, setTotal] = useState(initialTotal);
  const [sortId, setSortId] = useState<CatalogSortId>('popular');
  const [sortOpen, setSortOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const stickyHeadRef = useRef<HTMLDivElement>(null);
  const sortWrapRef = useRef<HTMLDivElement>(null);
  const cityWrapRef = useRef<HTMLDivElement>(null);
  const servicesWrapRef = useRef<HTMLDivElement>(null);
  const sortMenuId = useId();
  const cityMenuId = useId();
  const servicesMenuId = useId();

  const sortLabel = catalogSortLabel(sortId);
  const hasServiceChips = selectedServices.length > 0;

  useEffect(() => {
    setTotal(initialTotal);
  }, [initialTotal, query]);

  useEffect(() => {
    const root = document.documentElement;
    const headerEl = document.querySelector('header');
    const headEl = stickyHeadRef.current;

    const apply = () => {
      const headerH = headerEl ? Math.ceil(headerEl.getBoundingClientRect().height) : 94;
      const headH = headEl ? Math.ceil(headEl.getBoundingClientRect().height) : 48;
      root.style.setProperty('--site-header-offset', `${Math.max(headerH, 0)}px`);
      root.style.setProperty('--market-sticky-head-height', `${Math.max(headH, 0)}px`);
    };

    apply();
    const ro = new ResizeObserver(apply);
    if (headerEl) ro.observe(headerEl);
    if (headEl) ro.observe(headEl);
    window.addEventListener('resize', apply);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', apply);
      root.style.removeProperty('--site-header-offset');
      root.style.removeProperty('--market-sticky-head-height');
      root.style.removeProperty('--market-sticky-offset');
    };
  }, [hasServiceChips]);

  useEffect(() => {
    if (!sortOpen && !cityOpen && !servicesOpen) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (sortOpen && !sortWrapRef.current?.contains(t)) setSortOpen(false);
      if (cityOpen && !cityWrapRef.current?.contains(t)) setCityOpen(false);
      if (servicesOpen && !servicesWrapRef.current?.contains(t)) setServicesOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSortOpen(false);
        setCityOpen(false);
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortOpen, cityOpen, servicesOpen]);

  const onSelectSort = useCallback((id: CatalogSortId) => {
    setSortId(id);
    setSortOpen(false);
  }, []);

  const toggleService = useCallback((name: string) => {
    setSelectedServices((prev) => toggleInList(prev, name));
  }, []);

  const resetServices = useCallback(() => {
    setSelectedServices([]);
  }, []);

  return (
    <>
      <div className={catStyles.marketStickyHead} ref={stickyHeadRef}>
        <div className={catStyles.marketToolbar}>
          <div className={catStyles.marketSectionRowResult}>
            <div className={catStyles.marketZonesGroup} ref={cityWrapRef}>
              <button
                type="button"
                className={catStyles.marketToolbarBtn}
                aria-haspopup="listbox"
                aria-expanded={cityOpen}
                aria-controls={cityMenuId}
                onClick={() => {
                  setCityOpen((v) => !v);
                  setSortOpen(false);
                  setServicesOpen(false);
                }}
              >
                Город
                <span
                  className={
                    cityOpen
                      ? `${catStyles.marketToolbarChevron} ${catStyles.marketToolbarChevronOpen}`
                      : catStyles.marketToolbarChevron
                  }
                  aria-hidden
                />
              </button>
              {cityOpen ? (
                <ul
                  className={catStyles.marketZonesMenu}
                  id={cityMenuId}
                  role="listbox"
                  aria-label="Город"
                >
                  <li role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected
                      className={`${catStyles.marketSortMenuItem} ${catStyles.marketSortMenuItemActive}`}
                      onClick={() => setCityOpen(false)}
                    >
                      Москва
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>

            <div className={catStyles.marketZonesGroup} ref={servicesWrapRef}>
              <button
                type="button"
                className={catStyles.marketToolbarBtn}
                aria-haspopup="listbox"
                aria-expanded={servicesOpen}
                aria-controls={servicesMenuId}
                onClick={() => {
                  setServicesOpen((v) => !v);
                  setSortOpen(false);
                  setCityOpen(false);
                }}
              >
                Услуги
                <span
                  className={
                    servicesOpen
                      ? `${catStyles.marketToolbarChevron} ${catStyles.marketToolbarChevronOpen}`
                      : catStyles.marketToolbarChevron
                  }
                  aria-hidden
                />
              </button>
              {servicesOpen && services.length > 0 ? (
                <ul
                  className={catStyles.marketZonesMenu}
                  id={servicesMenuId}
                  role="listbox"
                  aria-multiselectable
                  aria-label="Услуги дизайнера"
                >
                  {services.map((name) => {
                    const selected = selectedServices.includes(name);
                    return (
                      <li key={name} role="presentation">
                        <label className={catStyles.marketZonesMenuItem}>
                          <AccountCheckbox
                            className={catStyles.marketZonesMenuCheckbox}
                            checked={selected}
                            onChange={() => toggleService(name)}
                            aria-label={name}
                          />
                          <span>{name}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </div>

          <div className={catStyles.marketToolbarEnd}>
            <p className={catStyles.marketProductCount} aria-live="polite">
              {formatCatalogProductCount(total)}
            </p>
            <div className={catStyles.marketSortGroup} ref={sortWrapRef}>
              <button
                type="button"
                className={catStyles.marketToolbarBtn}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                aria-controls={sortMenuId}
                onClick={() => {
                  setSortOpen((v) => !v);
                  setCityOpen(false);
                  setServicesOpen(false);
                }}
              >
                {sortLabel}
                <span
                  className={
                    sortOpen
                      ? `${catStyles.marketToolbarChevron} ${catStyles.marketToolbarChevronOpen}`
                      : catStyles.marketToolbarChevron
                  }
                  aria-hidden
                />
              </button>
              {sortOpen ? (
                <ul
                  className={catStyles.marketSortMenu}
                  id={sortMenuId}
                  role="listbox"
                  aria-label="Сортировка"
                >
                  {CATALOG_SORT_OPTIONS.map((opt) => (
                    <li key={opt.id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={opt.id === sortId}
                        className={
                          opt.id === sortId
                            ? `${catStyles.marketSortMenuItem} ${catStyles.marketSortMenuItemActive}`
                            : catStyles.marketSortMenuItem
                        }
                        onClick={() => onSelectSort(opt.id)}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>

        {hasServiceChips ? (
          <div className={catStyles.marketChipsRow}>
            <AdminPillChipList className={catStyles.marketZoneChips} aria-label="Выбранные услуги">
              {selectedServices.map((name) => (
                <AdminPillChip
                  key={name}
                  onRemove={() => toggleService(name)}
                  removeAriaLabel={`Убрать услугу ${name}`}
                >
                  {name}
                </AdminPillChip>
              ))}
            </AdminPillChipList>
            <button type="button" className={catStyles.marketChipsReset} onClick={resetServices}>
              Сбросить
            </button>
          </div>
        ) : null}
      </div>

      <DesignersListClient
        initialItems={initialItems}
        initialTotal={initialTotal}
        query={query}
        selectedServices={selectedServices}
        onTotalChange={setTotal}
      />
    </>
  );
}
