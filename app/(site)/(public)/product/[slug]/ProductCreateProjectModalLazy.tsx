'use client';

import dynamic from 'next/dynamic';
import type { PdpProjectDraftPayload } from '@/lib/designerProjects/pdpDraft';

export const ProductCreateProjectModalLazy = dynamic(
  () =>
    import('@/app/(site)/(account)/account/projects/components/CreateEditProjectModal').then(
      (m) => m.CreateEditProjectModal,
    ),
  { ssr: false, loading: () => null },
);

export type ProductCreateProjectModalLazyProps = {
  open: boolean;
  pendingLineDraft: PdpProjectDraftPayload | null;
  onClose: () => void;
  onSaveError: (message: string) => void;
  onSaved: (ctx: { createdProjectName?: string | null } | undefined) => void;
};

export function ProductCreateProjectModalGate({
  open,
  pendingLineDraft,
  onClose,
  onSaveError,
  onSaved,
}: ProductCreateProjectModalLazyProps) {
  if (!open || !pendingLineDraft) return null;
  return (
    <ProductCreateProjectModalLazy
      open={open}
      onClose={onClose}
      mode="create"
      projectId={null}
      initialDetail={null}
      pendingLineDraft={pendingLineDraft}
      onSaveError={onSaveError}
      onSaved={onSaved}
    />
  );
}
