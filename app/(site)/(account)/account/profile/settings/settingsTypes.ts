export type SettingsMeUser = {
  id: string;
  email: string | null;
  phone: string | null;
  consentPersonalDataAcceptedAt: string | null;
  consentSmsMarketingAcceptedAt: string | null;
};

export function formatPhoneForInput(raw: string | null | undefined): string {
  if (!raw || !String(raw).trim()) return '';
  const d = String(raw).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('7')) {
    return `+7 ${d.slice(1, 4)} ${d.slice(4, 7)}–${d.slice(7, 9)}–${d.slice(9, 11)}`;
  }
  if (d.length === 10) {
    return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}–${d.slice(6, 8)}–${d.slice(8, 10)}`;
  }
  return raw;
}
