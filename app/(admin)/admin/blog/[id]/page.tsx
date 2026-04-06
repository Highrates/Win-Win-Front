import { BlogPostEditorClient } from '../BlogPostEditorClient';
import catalogStyles from '../../catalog/catalogAdmin.module.css';

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main>
      <h1 className={catalogStyles.title}>Редактирование статьи</h1>
      <p className={catalogStyles.lead}>Изменения сохраняются по кнопке «Сохранить».</p>
      <BlogPostEditorClient postId={id} />
    </main>
  );
}
