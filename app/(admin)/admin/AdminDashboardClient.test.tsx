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
    title?: string;
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

vi.mock('@/lib/adminDashboard/adminDashboardApi', () => ({
  fetchOrdersDashboardSummary: vi.fn().mockResolvedValue({
    new: 2,
    active: 3,
  }),
  fetchSourcingDashboardSummary: vi.fn().mockResolvedValue({
    pendingReview: 1,
    inProgress: 0,
  }),
  fetchOrdersChatUnreadSummary: vi.fn().mockResolvedValue({
    total: 4,
    new: 1,
    active: 3,
    completed: 0,
  }),
  fetchQaUnreadSummary: vi.fn().mockResolvedValue({ total: 0 }),
  fetchCatalogDashboardSummary: vi.fn().mockResolvedValue({
    noModifications: 0,
    noVariants: 0,
    activeEmpty: 0,
    elementEmptyPool: 0,
    compositeIncomplete: 0,
  }),
  fetchPartnersDashboardSummary: vi.fn().mockResolvedValue({ new: 0 }),
  fetchSignupDashboardSummary: vi.fn().mockResolvedValue({ new: 0 }),
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

  it('filters dashboard cards by section access', async () => {
    useAdminPermissionsMock.mockReturnValue({
      loading: false,
      canAccessSection: (section: string) => section === 'orders',
      sections: ['orders'],
      isSuperAdmin: false,
    });

    render(<AdminDashboardClient />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Заказы/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: /Партнёры/i })).toBeNull();
    expect(screen.getByLabelText('Ассистент')).toBeInTheDocument();
  });

  it('shows denied banner when ?denied=1 and cleans URL', async () => {
    searchParamsGet.mockImplementation((key: string) => (key === 'denied' ? '1' : null));
    useAdminPermissionsMock.mockReturnValue({
      loading: false,
      canAccessSection: () => true,
      sections: ['orders', 'catalog', 'assistant'],
      isSuperAdmin: true,
    });

    render(<AdminDashboardClient />);

    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((el) => el.textContent?.includes('Нет доступа к этому разделу'))).toBe(
      true,
    );
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/admin');
    });
  });
});
