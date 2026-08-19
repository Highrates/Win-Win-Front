'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildPdpProjectDraftPayload } from '@/lib/designerProjects/buildPdpDraftPayload';
import {
  fetchDesignerProjectDetail,
  fetchDesignerProjectList,
  updateDesignerProject,
} from '@/lib/designerProjects/clientApi';
import { pdpDraftToLineSnapshot, savePayloadWithAppendedPdpLine } from '@/lib/designerProjects/payload';
import {
  getCachedIsAuthenticated,
  invalidateUserClientCaches,
} from '@/lib/userSessionClient';
import { UserAuthRequiredError } from '@/lib/userAuthRequiredClient';
import { addOrderPreparationLine, deleteOrderPreparationLine, patchOrderPreparationLineQuantity } from '@/lib/orderPreparation/clientApi';
import { writePdpProjectDraft, type PdpProjectDraftPayload } from '@/lib/designerProjects/pdpDraft';
import type {
  PublicProductElementApi,
  PublicProductModificationApi,
  PublicProductVariantApi,
} from '@/lib/publicProductFromApi';
import type { ProductOrderProjectOption } from './ProductOrderSplit';

type Params = {
  productId: string;
  productSlug: string;
  productName: string;
  modifications: PublicProductModificationApi[];
  elements: PublicProductElementApi[];
  effectiveModificationId: string | null;
  selections: Record<string, string>;
  matchedVariant: PublicProductVariantApi | null;
  configurationReadyForProject: boolean;
  galleryImages: string[];
  priceMin: number;
  priceMax: number;
  pushError: (message: string) => void;
  onLoginRequired: (retry: () => void) => void;
  onOrderAdded: () => void;
  onProjectAdded: (projectLabel: string) => void;
};

export function useProductPdpActions({
  productId,
  productSlug,
  productName,
  modifications,
  elements,
  effectiveModificationId,
  selections,
  matchedVariant,
  configurationReadyForProject,
  galleryImages,
  priceMin,
  priceMax,
  pushError,
  onLoginRequired,
  onOrderAdded,
  onProjectAdded,
}: Params) {
  const [designerProjects, setDesignerProjects] = useState<ProductOrderProjectOption[]>([]);
  const [designerProjectsLoading, setDesignerProjectsLoading] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const projectsFetchStarted = useRef(false);
  const [projectLineSaving, setProjectLineSaving] = useState(false);
  const [orderLineSaving, setOrderLineSaving] = useState(false);
  const [orderDraftLineId, setOrderDraftLineId] = useState<string | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number | null>(null);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [pendingLineDraftForModal, setPendingLineDraftForModal] = useState<PdpProjectDraftPayload | null>(
    null,
  );

  const buildProjectLineDraft = useCallback((): PdpProjectDraftPayload | null => {
    if (!configurationReadyForProject) return null;
    return buildPdpProjectDraftPayload({
      productId,
      productSlug,
      productDisplayName: productName,
      modifications,
      elements,
      thumbUrl: galleryImages[0] ?? null,
      modificationId: effectiveModificationId,
      selections,
      matchedVariant,
      catalogPriceMinRub: priceMin,
      catalogPriceMaxRub: priceMax,
    });
  }, [
    configurationReadyForProject,
    productId,
    productSlug,
    productName,
    modifications,
    elements,
    galleryImages,
    effectiveModificationId,
    selections,
    matchedVariant,
    priceMin,
    priceMax,
  ]);

  const refreshDesignerProjects = useCallback(async () => {
    setDesignerProjectsLoading(true);
    try {
      const data = await fetchDesignerProjectList();
      setDesignerProjects(
        data.projects.map((p) => ({
          id: p.id,
          name: p.name.trim() || 'Без названия',
        })),
      );
      setProjectsLoaded(true);
    } catch {
      setDesignerProjects([]);
    } finally {
      setDesignerProjectsLoading(false);
    }
  }, []);

  const ensureProjectsLoaded = useCallback(() => {
    if (projectsFetchStarted.current) return;
    projectsFetchStarted.current = true;
    void refreshDesignerProjects();
  }, [refreshDesignerProjects]);

  useEffect(() => {
    if (!createProjectModalOpen) return;
    ensureProjectsLoaded();
  }, [createProjectModalOpen, ensureProjectsLoaded]);

  async function requireAuth(retry: () => void): Promise<boolean> {
    const authed = await getCachedIsAuthenticated();
    if (authed) return true;
    onLoginRequired(retry);
    return false;
  }

  function handleAuthFailure(retry: () => void) {
    invalidateUserClientCaches({ authenticated: false });
    onLoginRequired(retry);
  }

  useEffect(() => {
    setOrderDraftLineId(null);
    setOrderQuantity(null);
  }, [matchedVariant?.id, effectiveModificationId, selections]);

  function findMatchingDraftLine(
    draft: Awaited<ReturnType<typeof addOrderPreparationLine>>,
    variantId: string | null | undefined,
  ) {
    const matches = draft.lines.filter(
      (line) =>
        line.productId === productId &&
        (line.productVariantId ?? null) === (variantId ?? null),
    );
    return matches[matches.length - 1] ?? null;
  }

  async function handleAddToOrder() {
    if (!configurationReadyForProject || orderLineSaving) return;
    if (!(await requireAuth(() => void handleAddToOrder()))) return;
    const draft = buildProjectLineDraft();
    if (!draft) return;
    setOrderLineSaving(true);
    try {
      const nextDraft = await addOrderPreparationLine({
        productId: draft.productId,
        productVariantId: draft.variantId,
        quantity: 1,
        unit: 'шт',
        snapshot: {
          ...pdpDraftToLineSnapshot(draft),
          productSlug: draft.productSlug,
          productName: draft.productName,
        },
      });
      const line = findMatchingDraftLine(nextDraft, draft.variantId);
      if (line) {
        setOrderDraftLineId(line.id);
        setOrderQuantity(line.quantity);
      }
      onOrderAdded();
    } catch (e) {
      if (e instanceof UserAuthRequiredError) {
        handleAuthFailure(() => void handleAddToOrder());
        return;
      }
      pushError(e instanceof Error ? e.message : 'Не удалось добавить товар в заказ. Попробуйте снова.');
    } finally {
      setOrderLineSaving(false);
    }
  }

  async function handleOrderQuantityDelta(delta: number) {
    if (!orderDraftLineId || orderLineSaving || !Number.isFinite(delta) || delta === 0) return;
    if (!(await requireAuth(() => void handleOrderQuantityDelta(delta)))) return;
    const currentQty = orderQuantity ?? 1;
    if (delta < 0 && currentQty <= 1) {
      setOrderLineSaving(true);
      try {
        await deleteOrderPreparationLine(orderDraftLineId);
        setOrderDraftLineId(null);
        setOrderQuantity(null);
      } catch (e) {
        if (e instanceof UserAuthRequiredError) {
          handleAuthFailure(() => void handleOrderQuantityDelta(delta));
          return;
        }
        pushError(e instanceof Error ? e.message : 'Не удалось обновить количество');
      } finally {
        setOrderLineSaving(false);
      }
      return;
    }
    const nextQty = Math.max(1, currentQty + delta);
    if (nextQty === currentQty) return;
    setOrderLineSaving(true);
    try {
      const nextDraft = await patchOrderPreparationLineQuantity(orderDraftLineId, nextQty);
      const line = nextDraft.lines.find((l) => l.id === orderDraftLineId);
      if (line) {
        setOrderQuantity(line.quantity);
      } else {
        setOrderDraftLineId(null);
        setOrderQuantity(null);
      }
    } catch (e) {
      if (e instanceof UserAuthRequiredError) {
        handleAuthFailure(() => void handleOrderQuantityDelta(delta));
        return;
      }
      pushError(e instanceof Error ? e.message : 'Не удалось обновить количество');
    } finally {
      setOrderLineSaving(false);
    }
  }

  async function handleAddToExistingProject(projectId: string) {
    if (!configurationReadyForProject || projectLineSaving) return;
    if (!(await requireAuth(() => void handleAddToExistingProject(projectId)))) return;
    const draft = buildProjectLineDraft();
    if (!draft) return;
    setProjectLineSaving(true);
    try {
      const detail = await fetchDesignerProjectDetail(projectId);
      await updateDesignerProject(projectId, savePayloadWithAppendedPdpLine(detail, draft));
      const label = designerProjects.find((p) => p.id === projectId)?.name?.trim() || 'Проект';
      onProjectAdded(label);
      if (projectsLoaded) {
        void refreshDesignerProjects();
      }
    } catch (e) {
      if (e instanceof UserAuthRequiredError) {
        handleAuthFailure(() => void handleAddToExistingProject(projectId));
        return;
      }
      pushError(
        e instanceof Error ? e.message : 'Не удалось добавить товар в проект. Попробуйте снова.',
      );
    } finally {
      setProjectLineSaving(false);
    }
  }

  async function handleCreateNewProject() {
    if (!configurationReadyForProject) return;
    if (!(await requireAuth(() => void handleCreateNewProject()))) return;
    const draft = buildProjectLineDraft();
    if (!draft) return;
    writePdpProjectDraft(draft);
    setPendingLineDraftForModal(draft);
    setCreateProjectModalOpen(true);
  }

  function handleProjectModalSaved(ctx: { createdProjectName?: string | null } | undefined) {
    const name = ctx?.createdProjectName?.trim() || 'Проект';
    onProjectAdded(name);
    setCreateProjectModalOpen(false);
    setPendingLineDraftForModal(null);
    if (projectsLoaded) {
      void refreshDesignerProjects();
    } else {
      projectsFetchStarted.current = false;
      ensureProjectsLoaded();
    }
  }

  function closeProjectModal() {
    setCreateProjectModalOpen(false);
    setPendingLineDraftForModal(null);
  }

  return {
    designerProjects,
    designerProjectsLoading: designerProjectsLoading && !projectsLoaded,
    projectLineSaving,
    orderLineSaving,
    createProjectModalOpen,
    pendingLineDraftForModal,
    ensureProjectsLoaded,
    handleAddToOrder,
    handleOrderQuantityDelta,
    orderQuantity,
    handleAddToExistingProject,
    handleCreateNewProject,
    handleProjectModalSaved,
    closeProjectModal,
  };
}
