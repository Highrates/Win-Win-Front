/** Этап 2: Страница дизайнера */
export default function DesignerPage({ params }: { params: { slug: string } }) {
  return (
    <main>
      <h1>Дизайнер: {params.slug}</h1>
    </main>
  );
}
