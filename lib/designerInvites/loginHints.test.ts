import { describe, expect, it } from 'vitest';
import {
  buildLoginWithInviteHref,
  DESIGNER_INVITE_EXISTING_ACCOUNT_HINT,
  DESIGNER_INVITE_STAFF_EMAIL_ERROR,
  formatDesignerInviteClaimError,
} from './loginHints';

describe('designer invite loginHints', () => {
  it('buildLoginWithInviteHref для существующего аккаунта', () => {
    const href = buildLoginWithInviteHref({
      token: 'tok',
      email: 'a@b.com',
      existing: true,
    });
    expect(href).toContain('designerInvite=tok');
    expect(href).toContain('inviteExisting=1');
    expect(href).toContain(encodeURIComponent('a@b.com'));
  });

  it('buildLoginWithInviteHref для staff — только ошибка', () => {
    const href = buildLoginWithInviteHref({ token: 'tok', staffError: true });
    expect(href).toContain('designerInviteError=');
    expect(decodeURIComponent(href)).toContain('сотруднику');
    expect(href).not.toContain('designerInvite=tok');
  });

  it('formatDesignerInviteClaimError дополняет email', () => {
    expect(formatDesignerInviteClaimError('Приглашение не подходит', 'x@y.ru')).toContain('x@y.ru');
  });

  it('тексты подсказок не пустые', () => {
    expect(DESIGNER_INVITE_EXISTING_ACCOUNT_HINT.length).toBeGreaterThan(20);
    expect(DESIGNER_INVITE_STAFF_EMAIL_ERROR.length).toBeGreaterThan(20);
  });
});
