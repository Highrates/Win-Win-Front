import { describe, expect, it } from 'vitest';
import {
  buildInviteMismatchPath,
  buildLoginWithInviteHref,
  buildRegisterWithInviteHref,
  DESIGNER_INVITE_DROPPED_HINT,
  DESIGNER_INVITE_ERROR_CODE,
  DESIGNER_INVITE_EXISTING_ACCOUNT_HINT,
  DESIGNER_INVITE_PHONE_ACCOUNT_HINT,
  DESIGNER_INVITE_STAFF_EMAIL_ERROR,
  formatDesignerInviteClaimError,
  isDesignerInviteRegistrationError,
  stripDroppedDesignerInviteParams,
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

  it('formatDesignerInviteClaimError дополняет email при mismatch code', () => {
    expect(
      formatDesignerInviteClaimError(
        'Приглашение не подходит',
        'x@y.ru',
        DESIGNER_INVITE_ERROR_CODE.MISMATCH,
      ),
    ).toContain('x@y.ru');
    expect(formatDesignerInviteClaimError('Приглашение не подходит', 'x@y.ru')).toBe(
      'Приглашение не подходит',
    );
  });

  it('тексты подсказок не пустые', () => {
    expect(DESIGNER_INVITE_EXISTING_ACCOUNT_HINT.length).toBeGreaterThan(20);
    expect(DESIGNER_INVITE_STAFF_EMAIL_ERROR.length).toBeGreaterThan(20);
    expect(DESIGNER_INVITE_DROPPED_HINT.length).toBeGreaterThan(20);
    expect(DESIGNER_INVITE_PHONE_ACCOUNT_HINT.length).toBeGreaterThan(20);
  });

  it('buildRegisterWithInviteHref сохраняет токен без ref', () => {
    const href = buildRegisterWithInviteHref({ token: 'tok', email: 'a@b.com' });
    expect(href).toContain('designerInvite=tok');
    expect(href).toContain(encodeURIComponent('a@b.com'));
    expect(href).not.toContain('ref=');
  });

  it('stripDroppedDesignerInviteParams убирает токен и leftover ref', () => {
    const q = stripDroppedDesignerInviteParams(
      'designerInvite=bad&ref=REF9&r=R9&prefillEmail=a%40b.com',
    );
    expect(q.get('designerInvite')).toBeNull();
    expect(q.get('ref')).toBeNull();
    expect(q.get('r')).toBeNull();
    expect(q.get('prefillEmail')).toBe('a@b.com');
  });

  it('isDesignerInviteRegistrationError по коду бэкенда', () => {
    expect(isDesignerInviteRegistrationError(DESIGNER_INVITE_ERROR_CODE.INVALID)).toBe(true);
    expect(isDesignerInviteRegistrationError(DESIGNER_INVITE_ERROR_CODE.MISMATCH)).toBe(true);
    expect(isDesignerInviteRegistrationError(undefined)).toBe(false);
    expect(isDesignerInviteRegistrationError('other')).toBe(false);
  });

  it('buildInviteMismatchPath передаёт только t', () => {
    const href = buildInviteMismatchPath('invite-tok');
    expect(href).toBe('/invite/designer/mismatch?t=invite-tok');
    expect(href).not.toContain('sessionEmail');
    expect(href).not.toContain('inviteEmail');
  });
});
