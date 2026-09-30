import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrandProjectsPanel } from './BrandProjectsPanel';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
    className?: string;
    target?: string;
    rel?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/admin-i18n/adminLocaleContext', () => ({
  useAdminLocale: () => ({ locale: 'ru', localeReady: true }),
}));

vi.mock('@/lib/adminConfirm/AdminConfirmProvider', () => ({
  useAdminConfirm: () => ({ confirm: vi.fn(async () => true) }),
}));

vi.mock('@/lib/adminConfirm/useUnsavedChangesGuard', () => ({
  useUnsavedChangesGuard: () => undefined,
}));

vi.mock('@/components/RichBlock/RichBlock', () => ({
  RichBlock: () => <div data-testid="rich-block" />,
}));

vi.mock('@/components/admin/MediaLibraryPickerModal/MediaLibraryPickerModal', () => ({
  MediaLibraryPickerModal: () => null,
}));

vi.mock('@/components/AccountConfirmDialog/AccountConfirmDialog', () => ({
  AccountConfirmDialog: () => null,
}));

vi.mock('@/app/(site)/(account)/account/cases/new/components/CaseProductsField', () => ({
  CaseProductsField: () => null,
}));

vi.mock('@/app/(site)/(account)/account/cases/new/components/CaseRoomTypeSelect', () => ({
  CaseRoomTypeSelect: () => null,
}));

const adminBackendJson = vi.fn();

vi.mock('@/lib/adminBackendFetch', () => ({
  adminBackendJson: (...args: unknown[]) => adminBackendJson(...args),
}));

describe('BrandProjectsPanel', () => {
  beforeEach(() => {
    adminBackendJson.mockReset();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ caseRoomTypeOptions: [] }),
      }),
    );
  });

  it('saves a new published project via POST', async () => {
    adminBackendJson
      .mockResolvedValueOnce([]) // load list
      .mockResolvedValueOnce({ id: 'new1', title: 'Loft' }) // create
      .mockResolvedValueOnce([]); // reload list

    render(<BrandProjectsPanel brandId="brand-1" brandSlug="acme" />);

    await waitFor(() => {
      expect(screen.getByText('Пока нет проектов. Добавьте первый.')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Открыть на витрине' })).toHaveAttribute(
      'href',
      '/projects?brand=acme',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Добавить проект' }));
    await screen.findByText('Новый проект');
    const titleInput = document.querySelector('input[required]') as HTMLInputElement | null;
    expect(titleInput).toBeTruthy();
    fireEvent.change(titleInput!, { target: { value: 'Loft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить проект' }));

    await waitFor(() => {
      const createCall = adminBackendJson.mock.calls.find(
        (c) =>
          c[0] === 'cases/admin/brands/brand-1/cases' &&
          (c[1] as { method?: string })?.method === 'POST',
      );
      expect(createCall).toBeTruthy();
      const body = JSON.parse(String((createCall![1] as { body: string }).body));
      expect(body.title).toBe('Loft');
      expect(body.coverLayout).toBe('9:16');
      expect(body.isPublished).toBe(true);
    });
  });
});
