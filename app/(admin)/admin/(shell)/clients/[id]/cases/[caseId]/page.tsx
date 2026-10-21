import { AdminCaseDetailClient } from './AdminCaseDetailClient';

export default async function AdminClientCasePage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>;
}) {
  const { id, caseId } = await params;
  return <AdminCaseDetailClient clientId={id.trim()} caseId={caseId.trim()} />;
}
