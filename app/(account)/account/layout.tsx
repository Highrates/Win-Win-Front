export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav>
        {/* Меню ЛК: Orders, Favorites, Projects, Cases, Team, Profile, Docs, Contact us */}
      </nav>
      {children}
    </div>
  );
}
