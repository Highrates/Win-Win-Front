import { ProductSetEditorClient } from '../ProductSetEditorClient';

export default async function EditProductSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <ProductSetEditorClient setId={id} />
    </main>
  );
}
