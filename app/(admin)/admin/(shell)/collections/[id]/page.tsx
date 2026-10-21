import { CuratedCollectionEditorClient } from '../CuratedCollectionEditorClient';

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <CuratedCollectionEditorClient collectionId={id} />
    </main>
  );
}
