import Link from 'next/link';
import { PricingSettingsClient } from './PricingSettingsClient';
import catalogStyles from '../../catalog/catalogAdmin.module.css';

export default function AdminPricingSettingsPage() {
  return (
    <main>
      <p className={catalogStyles.backRow}>
        <Link href="/admin" className={catalogStyles.backLink}>
          ← В админку
        </Link>
      </p>
      <h1 className={catalogStyles.title}>Ценообразование</h1>
      <PricingSettingsClient />
    </main>
  );
}
