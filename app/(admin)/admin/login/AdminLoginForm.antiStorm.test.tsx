import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminLoginForm } from './AdminLoginForm';

describe('AdminLoginForm anti-storm behavior', () => {
  const assign = vi.fn();
  const replace = vi.fn();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    assign.mockReset();
    replace.mockReset();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign, replace },
    });
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('session already authenticated → hard replace with sanitized from (not login loop)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true }),
    });

    render(
      <AdminLoginForm initialLocale="ru" from="/admin/login?from=/admin/orders" />,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/admin');
    });
    expect(assign).not.toHaveBeenCalled();
  });

  it('successful submit → hard assign to safe admin path', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { getByLabelText, getByRole } = render(
      <AdminLoginForm initialLocale="ru" from="/admin/clients/abc" />,
    );

    fireEvent.change(getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.change(getByLabelText('Пароль'), { target: { value: 'secret' } });
    fireEvent.click(getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith('/admin/clients/abc');
    });
  });

  it('checks session only once even if from prop identity is stable', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ authenticated: false }),
    });

    const { rerender } = render(<AdminLoginForm initialLocale="ru" from="/admin" />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const callsAfterMount = fetchMock.mock.calls.length;

    rerender(<AdminLoginForm initialLocale="ru" from="/admin" />);
    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBe(callsAfterMount);
    });
  });
});
