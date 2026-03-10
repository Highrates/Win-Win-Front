/** Этап 2: Страница товара */
export default function ProductPage({ params }: { params: { slug: string } }) {
  return (
    <main>
      <h1>Товар: {params.slug}</h1>
    </main>
  );
}
