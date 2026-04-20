import { adminBlogEditPageStrings } from '@/lib/admin-i18n/adminBlogI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { BlogPostEditorClient } from '../BlogPostEditorClient';
import catalogStyles from '../../catalog/catalogAdmin.module.css';

export default async function AdminBlogEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = getAdminLocale();
  const t = adminBlogEditPageStrings(locale);
  return (
    <main>
      <h1 className={catalogStyles.title}>{t.title}</h1>
      <p className={catalogStyles.lead}>{t.lead}</p>
      <BlogPostEditorClient postId={id} />
    </main>
  );
}
