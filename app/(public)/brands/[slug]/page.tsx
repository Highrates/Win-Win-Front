/** Этап 2: Страница бренда */
export default function BrandPage({ params }: { params: { slug: string } }) {
  return (
    <main>
      <h1>Бренд: {params.slug}</h1>
    </main>
  );
}
