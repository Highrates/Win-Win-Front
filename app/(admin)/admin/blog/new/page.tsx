import { BlogPostEditorClient } from '../BlogPostEditorClient';
import catalogStyles from '../../catalog/catalogAdmin.module.css';

export default function AdminBlogNewPage() {
  return (
    <main>
      <h1 className={catalogStyles.title}>Новая статья</h1>
      <p className={catalogStyles.lead}>Заголовок, рубрика, дата, краткое описание и основной текст.</p>
      <BlogPostEditorClient />
    </main>
  );
}
