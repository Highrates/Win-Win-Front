/** Этап 2: Страница статьи */
export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <main>
      <h1>Статья: {params.slug}</h1>
    </main>
  );
}
