import { describe, expect, it } from 'vitest';
import {
  formatInviteRowMeta,
  formatResendResultMessage,
  summarizeInviteStatuses,
  type ActiveDesignerInviteApi,
} from './activeInvites';

function item(
  status: ActiveDesignerInviteApi['status'],
  partial?: Partial<ActiveDesignerInviteApi>,
): ActiveDesignerInviteApi {
  return {
    id: status,
    email: `${status}@x.com`,
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    inviteLink: '',
    status,
    statusLabel: status,
    ...partial,
  };
}

describe('summarizeInviteStatuses', () => {
  it('собирает счётчики по статусам', () => {
    expect(
      summarizeInviteStatuses([
        item('pending'),
        item('pending'),
        item('pending_admin'),
        item('accepted'),
        item('expired'),
        item('revoked'),
      ]),
    ).toBe(
      'Ожидают ответа (2) · На проверке (1) · Принято (1) · Истекло (1) · Отозвано (1)',
    );
  });
});

describe('formatInviteRowMeta', () => {
  it('для pending показывает даты отправки и срока', () => {
    expect(
      formatInviteRowMeta(
        item('pending', {
          createdAt: '2026-11-09T10:00:00.000Z',
          expiresAt: '2026-11-23T10:00:00.000Z',
          statusLabel: 'Ожидает',
        }),
      ),
    ).toMatch(/^отправлено .+ · до .+$/);
  });

  it('для прочих статусов показывает statusLabel', () => {
    expect(formatInviteRowMeta(item('accepted', { statusLabel: 'Принято' }))).toBe('Принято');
  });
});

describe('formatResendResultMessage', () => {
  it('сообщает, если письмо не ушло', () => {
    expect(formatResendResultMessage({ emailSent: false })).toMatch(/не удалось отправить/i);
  });

  it('сообщает об успешной переотправке', () => {
    expect(formatResendResultMessage({ emailSent: true })).toMatch(/переотправлено/i);
  });
});
