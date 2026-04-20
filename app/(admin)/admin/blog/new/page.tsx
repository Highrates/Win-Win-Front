import { adminBlogNewPageStrings } from '@/lib/admin-i18n/adminBlogI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { BlogPostEditorClient } from '../BlogPostEditorClient';
import catalogStyles from '../../catalog/catalogAdmin.module.css';

export default function AdminBlogNewPage() {
  const locale = getAdminLocale();
  const t = adminBlogNewPageStrings(locale);
  return (
    <main>
      <h1 className={catalogStyles.title}>{t.title}</h1>
      <p className={catalogStyles.lead}>{t.lead}</p>
      <BlogPostEditorClient />
    </main>
  );
}
