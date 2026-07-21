'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildPdpProjectDraftPayload } from '@/lib/designerProjects/buildPdpDraftPayload';
import {
  fetchDesignerProjectDetail,
  fetchDesignerProjectList,
  updateDesignerProject,
} from '@/lib/designerProjects/clientApi';
import { pdpDraftToLineSnapshot, savePayloadWithAppendedPdpLine } from '@/lib/designerProjects/payload';
import { addOrderPreparationLine } from '@/lib/orderPreparation/clientApi';
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
  onOrderAdded,
  onProjectAdded,
}: Params) {
  const [designerProjects, setDesignerProjects] = useState<ProductOrderProjectOption[]>([]);
  const [designerProjectsLoading, setDesignerProjectsLoading] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const projectsFetchStarted = useRef(false);
  const [projectLineSaving, setProjectLineSaving] = useState(false);
  const [orderLineSaving, setOrderLineSaving] = useState(false);
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

  async function handleAddToOrder() {
    if (!configurationReadyForProject || orderLineSaving) return;
    const draft = buildProjectLineDraft();
    if (!draft) return;
    setOrderLineSaving(true);
    try {
      await addOrderPreparationLine({
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
      onOrderAdded();
    } catch (e) {
      pushError(e instanceof Error ? e.message : 'Не удалось добавить товар в заказ. Попробуйте снова.');
    } finally {
      setOrderLineSaving(false);
    }
  }

  async function handleAddToExistingProject(projectId: string) {
    if (!configurationReadyForProject || projectLineSaving) return;
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
      pushError(
        e instanceof Error ? e.message : 'Не удалось добавить товар в проект. Попробуйте снова.',
      );
    } finally {
      setProjectLineSaving(false);
    }
  }

  function handleCreateNewProject() {
    if (!configurationReadyForProject) return;
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
    handleAddToExistingProject,
    handleCreateNewProject,
    handleProjectModalSaved,
    closeProjectModal,
  };
}
