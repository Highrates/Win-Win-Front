import Link from 'next/link';
import styles from './dashboard.module.css';

const LINKS: { href: string; label: string; note: string }[] = [
  { href: '/admin/catalog', label: 'Каталог', note: 'Товары и категории' },
  { href: '/admin/brands', label: 'Бренды', note: 'Бренды на сайте' },
  { href: '/admin/orders', label: 'Заказы', note: 'Статусы и документы' },
  { href: '/admin/clients', label: 'Клиенты', note: 'Пользователи' },
  { href: '/admin/blog', label: 'Блог', note: 'Статьи' },
  { href: '/admin/referrals', label: 'Рефералы', note: 'Программа' },
  { href: '/admin/collections', label: 'Коллекции', note: 'Публичные подборки' },
  { href: '/admin/product-sets', label: 'Наборы', note: 'Только товары' },
  { href: '/admin/pages', label: 'Страницы', note: 'Инфостраницы' },
  { href: '/admin/modeling', label: 'Моделирование', note: 'Сервис моделирования' },
];

export default function AdminDashboardPage() {
  return (
    <main>
      <h1 className={styles.title}>Дашборд</h1>
      <p className={styles.lead}>
        Выберите раздел в меню слева или перейдите по карточкам ниже. Данные пока наполняются через API.
      </p>
      <ul className={styles.grid}>
        {LINKS.map(({ href, label, note }) => (
          <li key={href}>
            <Link href={href} className={styles.card}>
              <span className={styles.cardTitle}>{label}</span>
              <span className={styles.cardNote}>{note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
