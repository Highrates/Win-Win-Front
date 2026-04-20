import Link from 'next/link';
import { adminNavBackToDashboard, adminPricingPage } from '@/lib/admin-i18n/adminMiscPagesI18n';
import { getAdminLocale } from '@/lib/admin-i18n/getAdminLocale';
import { PricingSettingsClient } from './PricingSettingsClient';
import catalogStyles from '../../catalog/catalogAdmin.module.css';

export default function AdminPricingSettingsPage() {
  const locale = getAdminLocale();
  const t = adminPricingPage(locale);
  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          {adminNavBackToDashboard(locale)}
        </Link>
      </p>
      <h1 className={catalogStyles.title}>{t.title}</h1>
      <PricingSettingsClient />
    </main>
  );
}
