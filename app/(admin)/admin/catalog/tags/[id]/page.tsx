import { CatalogTagEditorClient } from '../CatalogTagEditorClient';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCatalogTagEditPage({ params }: Props) {
  const { id } = await params;
  return <CatalogTagEditorClient tagId={id} />;
}
