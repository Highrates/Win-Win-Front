import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminRouteGuard } from './AdminRouteGuard';

const replace = vi.fn();
let pathnameMock = '/admin/orders';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathnameMock,
}));

const useAdminPermissionsMock = vi.fn();

vi.mock('./AdminPermissionsProvider', () => ({
  useAdminPermissions: () => useAdminPermissionsMock(),
}));

describe('AdminRouteGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    pathnameMock = '/admin/orders';
  });

  it('shows loading skeleton while permissions load', () => {
    useAdminPermissionsMock.mockReturnValue({
      loading: true,
      staff: null,
      canAccessPathname: () => true,
    });

    const { container } = render(
      <AdminRouteGuard>
        <div data-testid="protected">content</div>
      </AdminRouteGuard>,
    );

    expect(container.querySelector('[data-testid="protected"]')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirects to login when session has no staff', async () => {
    pathnameMock = '/admin';
    useAdminPermissionsMock.mockReturnValue({
      loading: false,
      staff: null,
      canAccessPathname: () => true,
    });

    render(
      <AdminRouteGuard>
        <div>content</div>
      </AdminRouteGuard>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('redirects moderator away from denied pathname', async () => {
    pathnameMock = '/admin/foo';
    useAdminPermissionsMock.mockReturnValue({
      loading: false,
      staff: { isSuperAdmin: false, sections: ['orders'] },
      canAccessPathname: () => false,
    });

    render(
      <AdminRouteGuard>
        <div>content</div>
      </AdminRouteGuard>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/admin?denied=1');
    });
  });

  it('skips redirect on login page', async () => {
    pathnameMock = '/admin/login';
    useAdminPermissionsMock.mockReturnValue({
      loading: false,
      staff: null,
      canAccessPathname: () => false,
    });

    render(
      <AdminRouteGuard>
        <div data-testid="login-child">login</div>
      </AdminRouteGuard>,
    );

    await waitFor(() => {
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
