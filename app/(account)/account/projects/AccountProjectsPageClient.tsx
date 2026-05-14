'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FlashBanner } from '@/components/FlashBanner/FlashBanner';
import { AccountProjectTabs } from '@/components/AccountProjectTabs/AccountProjectTabs';
import { Button } from '@/components/Button';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useFlashBanner } from '@/hooks/useFlashBanner';
import { fetchDesignerProjectDetail } from '@/lib/designerProjects/clientApi';
import { readPdpProjectDraft, type PdpProjectDraftPayload } from '@/lib/designerProjects/pdpDraft';
import { addOrderPreparationLine, fetchOrderPreparationDraft } from '@/lib/orderPreparation/clientApi';
import { designerProjectLineToAddOrderBody } from '@/lib/orderPreparation/designerProjectLineToAddOrderBody';
import { storeSelectOnlyPreparationLineIds } from '@/lib/orderPreparation/selectOnlyFromProjectSession';
import { AccountProjectsPageSkeleton } from './AccountProjectsPageSkeleton';
import { AccountProjectsCta } from './components/AccountProjectsCta';
import { AccountProjectsLinesList } from './components/AccountProjectsLinesList';
import { AccountProjectsSectionToolbar } from './components/AccountProjectsSectionToolbar';
import { CreateEditProjectModal } from './components/CreateEditProjectModal';
import { useDesignerProjectsBootstrap } from './hooks/useDesignerProjectsBootstrap';
import { useDesignerProjectDetail } from './hooks/useDesignerProjectDetail';
import { useProjectLineMutations } from './hooks/useProjectLineMutations';
import { useProjectLinesDerived } from './hooks/useProjectLinesDerived';
import styles from './page.module.css';

const PROJECT_Q = 'project';
const PENDING_LINE_Q = 'pendingLine';

export function AccountProjectsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { summaries, loadErr, refreshList, listReady } = useDesignerProjectsBootstrap();
  const { flash, pushError, dismiss } = useFlashBanner();
  const onMutationError = useCallback((message: string) => pushError(message), [pushError]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeSummary = summaries[selectedIndex] ?? null;
  const { detail, setDetail } = useDesignerProjectDetail(activeSummary?.id ?? null, {
    onDetailError: pushError,
  });

  const [sectionTab, setSectionTab] = useState<string>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [ctaAccordionOpen, setCtaAccordionOpen] = useState(false);
  const isCtaAccordionLayout = useMediaQuery('(max-width: 768px)');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingLineDraft, setPendingLineDraft] = useState<PdpProjectDraftPayload | null>(null);

  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const { sectionTabs, visibleLines, displayTotal, itemCount } = useProjectLinesDerived(detail, sectionTab);

  const onRemovedLines = useCallback((removedIds: string[]) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      for (const id of removedIds) n.delete(id);
      return n;
    });
    setSelectionMode(false);
    setCtaAccordionOpen(false);
  }, []);

  const { confirmRemoveLines, confirmRemoveSingleLine, updateQuantity } = useProjectLineMutations({
    detail,
    setDetail,
    activeSummary,
    refreshList,
    onRemovedLines,
    onMutationError,
  });

  /** Выбранный проект в query для шаринга и устойчивости к порядку в списке */
  const handleProjectTabSelect = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      const id = summaries[index]?.id;
      if (!id) return;
      const next = new URLSearchParams(searchParams.toString());
      next.set(PROJECT_Q, id);
      router.replace(`/account/projects?${next.toString()}`, { scroll: false });
    },
    [summaries, searchParams, router],
  );

  useEffect(() => {
    if (summaries.length === 0) return;
    const pid = searchParams.get(PROJECT_Q);
    if (!pid) return;
    const idx = summaries.findIndex((p) => p.id === pid);
    if (idx < 0) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete(PROJECT_Q);
      const q = next.toString();
      router.replace(q ? `/account/projects?${q}` : '/account/projects', { scroll: false });
      return;
    }
    setSelectedIndex(idx);
  }, [summaries, searchParams, router]);

  useEffect(() => {
    if (summaries.length === 0) return;
    if (searchParams.get(PROJECT_Q)) return;
    const id = summaries[selectedIndex]?.id ?? summaries[0]?.id;
    if (!id) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set(PROJECT_Q, id);
    router.replace(`/account/projects?${next.toString()}`, { scroll: false });
  }, [summaries, selectedIndex, searchParams, router]);

  useEffect(() => {
    if (searchParams.get(PENDING_LINE_Q) !== '1') return;
    setPendingLineDraft(readPdpProjectDraft());
    setModalMode('create');
    setEditingId(null);
    setModalOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(PENDING_LINE_Q);
    const q = next.toString();
    router.replace(q ? `/account/projects?${q}` : '/account/projects', { scroll: false });
  }, [searchParams, router]);

  useEffect(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, [selectedIndex, sectionTab]);

  useEffect(() => {
    setSectionTab('all');
  }, [selectedIndex]);

  useEffect(() => {
    if (summaries.length === 0) {
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex >= summaries.length) setSelectedIndex(summaries.length - 1);
  }, [summaries.length, selectedIndex]);

  useEffect(() => {
    if (detail && detail.lines.length === 0) setSectionTab('all');
  }, [detail?.lines.length]);

  const projectNames = useMemo(
    () => summaries.map((p) => p.name.trim() || 'Без названия'),
    [summaries],
  );

  const openCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setPendingLineDraft(null);
    setModalOpen(true);
  };

  const openEdit = () => {
    if (!activeSummary) return;
    setModalMode('edit');
    setEditingId(activeSummary.id);
    setPendingLineDraft(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setPendingLineDraft(null);
  };

  const onModalSaved = () => {
    void refreshList();
    if (activeSummary?.id) {
      void fetchDesignerProjectDetail(activeSummary.id).then(setDetail);
    }
  };

  const onSelectAllEnter = () => {
    setSelectionMode(true);
    setSelectedIds(new Set(visibleLines.map((l) => l.id)));
  };

  const onSelectAllCancel = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const onLineSelectedChange = useCallback((lineId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (checked) n.add(lineId);
      else n.delete(lineId);
      return n;
    });
  }, []);

  const handleCheckoutToOrders = useCallback(async () => {
    if (!detail?.lines.length || checkoutBusy) return;
    setCheckoutBusy(true);
    try {
      const before = await fetchOrderPreparationDraft();
      const beforeIds = new Set(before.lines.map((l) => l.id));
      let lastDraft = before;
      for (const line of detail.lines) {
        lastDraft = await addOrderPreparationLine(designerProjectLineToAddOrderBody(line));
      }
      const newIds = lastDraft.lines.filter((l) => !beforeIds.has(l.id)).map((l) => l.id);
      storeSelectOnlyPreparationLineIds(newIds);
      router.push('/account/orders');
    } catch (e) {
      onMutationError(e instanceof Error ? e.message : 'Не удалось перенести товары в заказ');
    } finally {
      setCheckoutBusy(false);
    }
  }, [detail, checkoutBusy, router, onMutationError]);

  return (
    <>
      <FlashBanner flash={flash} onDismiss={dismiss} />
      {loadErr ? (
        <div className={styles.page}>
          <p className={styles.emptyText}>{loadErr}</p>
          <Button type="button" variant="primary" onClick={() => void refreshList()}>
            Повторить
          </Button>
        </div>
      ) : !listReady ? (
        <AccountProjectsPageSkeleton />
      ) : summaries.length === 0 ? (
        <div className={styles.page}>
          <div className={styles.toolbar}>
            <div />
            <Button variant="primary" className={styles.createProjectButton} type="button" onClick={openCreate}>
              Создать проект
            </Button>
          </div>
          <p className={styles.emptyProjectsOnly}>Проектов пока нет</p>
        </div>
      ) : (
        <div className={styles.page}>
          <div className={styles.toolbar}>
            <AccountProjectTabs selectedIndex={selectedIndex} onSelect={handleProjectTabSelect} projects={projectNames} />
            <Button variant="primary" className={styles.createProjectButton} type="button" onClick={openCreate}>
              Создать проект
            </Button>
          </div>

          <div className={styles.projectHeader}>
            <div className={styles.projectTitleRow}>
              <span className={styles.projectTitle}>{activeSummary?.name.trim() || 'Проект'}</span>
              <button type="button" className={styles.iconButton} aria-label="Редактировать проект" onClick={openEdit}>
                <img src="/icons/edit.svg" alt="" width={20} height={20} className={styles.iconBlack} />
              </button>
            </div>
            <div className={styles.projectTools}>
              <button type="button" className={styles.specLink} aria-label="Скачать спецификацию PDF">
                <img src="/icons/document-download.svg" alt="" width={20} height={20} className={styles.specIcon} aria-hidden />
                <span>Спецификация PDF</span>
              </button>
              <button type="button" className={styles.iconButton} aria-label="Заметки по проекту">
                <img src="/icons/note.svg" alt="" width={20} height={20} />
              </button>
            </div>
          </div>

          <p className={styles.projectAddress}>
            {detail?.address?.trim() ? <>Адрес: {detail.address.trim()}</> : <>Адрес не указан</>}
          </p>

          <AccountProjectsCta
            isAccordionLayout={isCtaAccordionLayout}
            ctaAccordionOpen={ctaAccordionOpen}
            onToggleAccordion={() => setCtaAccordionOpen((o) => !o)}
            itemCount={itemCount}
            displayTotal={displayTotal}
            onCheckout={handleCheckoutToOrders}
            checkoutBusy={checkoutBusy}
          />

          {detail && detail.lines.length === 0 ? (
            <div className={styles.emptyProjectCatalog}>
              <Button
                type="button"
                variant="secondary"
                className={styles.openCatalogButton}
                onClick={() => window.open('/catalog', '_blank', 'noopener,noreferrer')}
              >
                Открыть каталог
              </Button>
            </div>
          ) : (
            <AccountProjectsSectionToolbar
              sectionTabs={sectionTabs}
              sectionTab={sectionTab}
              onSectionTabChange={setSectionTab}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelectAllEnter={onSelectAllEnter}
              onSelectAllCancel={onSelectAllCancel}
              onDeleteSelected={() => confirmRemoveLines(Array.from(selectedIds))}
            />
          )}

          <AccountProjectsLinesList
            visibleLines={visibleLines}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onLineSelectedChange={onLineSelectedChange}
            onRemoveLine={confirmRemoveSingleLine}
            onQuantityDelta={(lineId, d) => void updateQuantity(lineId, d)}
          />
        </div>
      )}

      <CreateEditProjectModal
        open={modalOpen}
        onClose={closeModal}
        mode={modalMode}
        projectId={editingId}
        initialDetail={modalMode === 'edit' && detail && editingId === detail.id ? detail : null}
        pendingLineDraft={pendingLineDraft}
        onSaved={onModalSaved}
        onSaveError={pushError}
      />
    </>
  );
}
