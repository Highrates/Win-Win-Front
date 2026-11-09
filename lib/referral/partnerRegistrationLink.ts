/** Публичная ссылка регистрации под реферальным кодом партнёра. */
export function buildPartnerRegistrationUrl(referralCode: string, origin?: string): string {
  const code = referralCode.trim();
  const base = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  const q = new URLSearchParams({ ref: code });
  return `${base}/register/email?${q.toString()}`;
}

export function partnerReferralQrFilename(referralCode: string): string {
  const safe = referralCode.trim().replace(/[^\w-]+/g, '_');
  return `wupapa-ref-${safe || 'partner'}.png`;
}

/** Подпись вкладки «По email» в модалке приглашения. */
export const INVITE_TAB_EMAIL_CAPTION =
  'Персональная ссылка только для этого email. Если переслать письмо другому человеку, приглашение не сработает.';

/** Подпись вкладки «По ссылке». */
export const INVITE_TAB_PUBLIC_CAPTION =
  'Общая ссылка с вашим реферальным кодом: человек станет вашим рефералом после регистрации. Заявку на статус дизайнера-партнёра Wupapa он подаёт отдельно в кабинете.';

/**
 * После регистрации по общей ?ref= — профиль с welcome и мягким предложением стать
 * дизайнером-партнёром (без автооткрытия модалки заявки).
 */
export function buildPartnerSuggestAfterRefRegistrationPath(referralCode: string): string {
  const q = new URLSearchParams();
  q.set('tab', 'info');
  q.set('welcome', '1');
  q.set('partnerSuggest', '1');
  const code = referralCode.trim();
  if (code) q.set('prefillRef', code);
  return `/account/profile?${q.toString()}`;
}

export function buildPartnerApplyAfterRefRegistrationPath(referralCode: string): string {
  return buildPartnerSuggestAfterRefRegistrationPath(referralCode);
}
