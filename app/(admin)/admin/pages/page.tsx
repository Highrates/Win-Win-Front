import catalogStyles from '@/app/(admin)/admin/catalog/catalogAdmin.module.css';
import { adminPagesScreen } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';

/** Этап 12: Управление информационными страницами и страницей о нас */
export default function AdminPagesPage() {
  const locale = getAdminLocale();
  const t = adminPagesScreen(locale);
  return (
    <main>
      <h1 className={catalogStyles.title}>{t.title}</h1>
    </main>
  );
}
