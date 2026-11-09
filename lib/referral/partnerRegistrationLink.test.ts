import { describe, expect, it } from 'vitest';
import {
  buildPartnerSuggestAfterRefRegistrationPath,
  buildPartnerRegistrationUrl,
  INVITE_TAB_EMAIL_CAPTION,
  INVITE_TAB_PUBLIC_CAPTION,
} from './partnerRegistrationLink';

describe('partnerRegistrationLink', () => {
  it('buildPartnerRegistrationUrl с ref', () => {
    expect(buildPartnerRegistrationUrl('REF1', 'https://wupapa.test')).toBe(
      'https://wupapa.test/register/email?ref=REF1',
    );
  });

  it('buildPartnerSuggestAfterRefRegistrationPath — welcome + мягкий баннер, без partnerApply', () => {
    const href = buildPartnerSuggestAfterRefRegistrationPath('REF9');
    expect(href).toContain('welcome=1');
    expect(href).toContain('partnerSuggest=1');
    expect(href).toContain('prefillRef=REF9');
    expect(href).not.toContain('partnerApply=1');
  });

  it('подписи вкладок не пустые', () => {
    expect(INVITE_TAB_EMAIL_CAPTION.length).toBeGreaterThan(40);
    expect(INVITE_TAB_PUBLIC_CAPTION.length).toBeGreaterThan(40);
  });
});
