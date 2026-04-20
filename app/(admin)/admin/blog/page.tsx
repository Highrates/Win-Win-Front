import { adminBlogPageTitle } from '@/lib/admin-i18n/adminBlogI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { BlogListClient } from './BlogListClient';
import catalogStyles from '../catalog/catalogAdmin.module.css';

export default function AdminBlogPage() {
  const locale = getAdminLocale();
  return (
    <main>
      <h1 className={catalogStyles.title}>{adminBlogPageTitle(locale)}</h1>
      <BlogListClient />
    </main>
  );
}
