import { UserAuthProvider } from '@/contexts/UserAuthContext';
import { getServerUserAuthenticated } from '@/lib/userSessionServer';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const initialAuthenticated = await getServerUserAuthenticated();
  return (
    <UserAuthProvider initialAuthenticated={initialAuthenticated}>{children}</UserAuthProvider>
  );
}
