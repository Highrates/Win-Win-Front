/** Этап 11: Страница коллекции (публичная) */
export default function PublicCollectionPage({ params }: { params: { slug: string } }) {
  return (
    <main>
      <h1>Коллекция: {params.slug}</h1>
    </main>
  );
}
