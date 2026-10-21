/** Корневой layout админки: без chrome. Shell — в `(shell)/layout.tsx`, login — sibling. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
