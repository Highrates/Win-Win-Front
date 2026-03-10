/** Этап 11: Информационные страницы (доставка, оплата, контакты и т.д.) */
export default function InfoPage({ params }: { params: { slug: string } }) {
  return (
    <main>
      <h1>Информация: {params.slug}</h1>
      <p>Контент из Page (CMS)</p>
    </main>
  );
}
