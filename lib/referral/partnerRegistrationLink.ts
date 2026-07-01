/** Публичная ссылка регистрации под реферальным кодом партнёра. */
export function buildPartnerRegistrationUrl(referralCode: string, origin?: string): string {
  const code = referralCode.trim();
  const base = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  const q = new URLSearchParams({ ref: code });
  return `${base}/register/email?${q.toString()}`;
}

export function partnerReferralQrFilename(referralCode: string): string {
  const safe = referralCode.trim().replace(/[^\w-]+/g, '_');
  return `win-win-ref-${safe || 'partner'}.png`;
}
