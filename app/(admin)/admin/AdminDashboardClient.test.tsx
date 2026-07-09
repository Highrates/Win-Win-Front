import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminDashboardClient } from './AdminDashboardClient';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const replace = vi.fn();
const searchParamsGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: searchParamsGet }),
}));

vi.mock('@/lib/admin-i18n/adminLocaleContext', () => ({
  useAdminLocale: () => ({ locale: 'ru', localeReady: true }),
}));

const useAdminPermissionsMock = vi.fn();

vi.mock('@/lib/adminPermissions/AdminPermissionsProvider', () => ({
  useAdminPermissions: () => useAdminPermissionsMock(),
}));

describe('AdminDashboardClient', () => {
  beforeEach(() => {
    replace.mockClear();
    searchParamsGet.mockReturnValue(null);
  });

  it('filters dashboard cards by section access', () => {
    useAdminPermissionsMock.mockReturnValue({
      loading: false,
      canAccessSection: (section: string) => section === 'orders',
    });

    render(<AdminDashboardClient />);

    expect(screen.getByRole('link', { name: /Заказы/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Бренды/i })).toBeNull();
  });

  it('shows denied banner when ?denied=1 and cleans URL', async () => {
    searchParamsGet.mockImplementation((key: string) => (key === 'denied' ? '1' : null));
    useAdminPermissionsMock.mockReturnValue({
      loading: false,
      canAccessSection: () => true,
    });

    render(<AdminDashboardClient />);

    expect(screen.getByRole('alert')).toHaveTextContent('Нет доступа к этому разделу');
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/admin');
    });
  });
});
