import { adminModelingPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';

/** Этап 3: Моделирование (админ) */
export default function AdminModelingPage() {
  const locale = getAdminLocale();
  const t = adminModelingPage(locale);
  return (
    <main>
      <h1>{t.title}</h1>
      <p>{t.lead}</p>
    </main>
  );
}
