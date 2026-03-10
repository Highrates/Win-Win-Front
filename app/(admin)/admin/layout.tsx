export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>{/* Меню админки: Каталог, Заказы, Рефералы, Блог, Настройки */}</nav>
      {children}
    </div>
  );
}
