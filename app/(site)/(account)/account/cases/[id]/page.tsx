'use client';

import { CaseFormEditor } from '../new/components/CaseFormEditor';

export default function EditCasePage({ params }: { params: { id: string } }) {
  const caseId = typeof params?.id === 'string' ? params.id.trim() : '';
  return <CaseFormEditor mode="edit" caseId={caseId} />;
}
