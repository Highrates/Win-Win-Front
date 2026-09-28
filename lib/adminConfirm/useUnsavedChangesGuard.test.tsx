import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

const replace = vi.fn();
const confirm = vi.fn<() => Promise<boolean>>();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/adminConfirm/AdminConfirmProvider', () => ({
  useAdminConfirm: () => ({ confirm }),
}));

function addLink(href: string, attrs: Record<string, string> = {}): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
  a.textContent = 'link';
  document.body.appendChild(a);
  return a;
}

function click(el: Element, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  el.dispatchEvent(event);
  return event;
}

describe('useUnsavedChangesGuard', () => {
  beforeEach(() => {
    replace.mockReset();
    confirm.mockReset();
    window.history.replaceState(null, '', '/admin/settings/email-notifications/order_chat_reply');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('does nothing without unsaved changes', () => {
    renderHook(() => useUnsavedChangesGuard(false));
    const event = click(addLink('/admin/orders'));
    expect(event.defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('asks before following an internal link and navigates on confirm', async () => {
    confirm.mockResolvedValue(true);
    renderHook(() => useUnsavedChangesGuard(true));
    const event = click(addLink('/admin/orders?tab=new'));
    expect(event.defaultPrevented).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/orders?tab=new'));
  });

  it('stays on the page when leaving is cancelled', async () => {
    confirm.mockResolvedValue(false);
    renderHook(() => useUnsavedChangesGuard(true));
    click(addLink('/admin/orders'));
    await waitFor(() => expect(confirm).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();
  });

  it('ignores external links, new tabs and modifier clicks', () => {
    renderHook(() => useUnsavedChangesGuard(true));
    expect(click(addLink('https://example.com/x')).defaultPrevented).toBe(false);
    expect(click(addLink('/admin/orders', { target: '_blank' })).defaultPrevented).toBe(false);
    expect(click(addLink('/admin/orders'), { metaKey: true }).defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('guards the browser back button with an extra history entry', async () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
    confirm.mockResolvedValue(true);
    renderHook(() => useUnsavedChangesGuard(true));
    expect(window.history.state?.__unsavedChangesGuard).toBe(true);

    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(confirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(go).toHaveBeenCalledWith(-2));
  });

  it('removes its history entry once changes are saved', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined);
    const { rerender } = renderHook(({ dirty }) => useUnsavedChangesGuard(dirty), { initialProps: { dirty: true } });
    rerender({ dirty: false });
    expect(back).toHaveBeenCalledTimes(1);
  });
});
