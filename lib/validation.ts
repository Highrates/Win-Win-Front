/** Возвращает сообщение об ошибке или null, если значение допустимо. */

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmailRequired(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Введите email';
  if (!EMAIL_RE.test(t)) return 'Некорректный email';
  return null;
}

export type PhoneCountryOption = {
  iso: string;
  dial: string;
  flag: string;
  name: string;
  /** Допустимая длина национального номера (только цифры, без кода страны) */
  nationalLengths: readonly number[];
};

export const PHONE_COUNTRIES: readonly PhoneCountryOption[] = [
  { iso: 'RU', dial: '7', flag: '🇷🇺', name: 'Россия', nationalLengths: [10] },
  { iso: 'KZ', dial: '7', flag: '🇰🇿', name: 'Казахстан', nationalLengths: [10] },
  { iso: 'BY', dial: '375', flag: '🇧🇾', name: 'Беларусь', nationalLengths: [9] },
  { iso: 'UA', dial: '380', flag: '🇺🇦', name: 'Украина', nationalLengths: [9] },
  { iso: 'AM', dial: '374', flag: '🇦🇲', name: 'Армения', nationalLengths: [8] },
  { iso: 'AZ', dial: '994', flag: '🇦🇿', name: 'Азербайджан', nationalLengths: [9] },
  { iso: 'GE', dial: '995', flag: '🇬🇪', name: 'Грузия', nationalLengths: [9] },
  { iso: 'KG', dial: '996', flag: '🇰🇬', name: 'Кыргызстан', nationalLengths: [9] },
  { iso: 'MD', dial: '373', flag: '🇲🇩', name: 'Молдова', nationalLengths: [8] },
  { iso: 'TJ', dial: '992', flag: '🇹🇯', name: 'Таджикистан', nationalLengths: [9] },
  { iso: 'UZ', dial: '998', flag: '🇺🇿', name: 'Узбекистан', nationalLengths: [9] },
  { iso: 'TM', dial: '993', flag: '🇹🇲', name: 'Туркменистан', nationalLengths: [8] },
  { iso: 'CN', dial: '86', flag: '🇨🇳', name: 'Китай', nationalLengths: [11] },
] as const;

export function getPhoneCountry(iso: string): PhoneCountryOption | undefined {
  return PHONE_COUNTRIES.find((c) => c.iso === iso);
}

export function validateNationalPhone(iso: string, nationalDigits: string): string | null {
  const digits = nationalDigits.replace(/\D/g, '');
  if (!digits) return 'Введите номер телефона';
  const country = getPhoneCountry(iso);
  if (!country) return 'Выберите страну';
  if (!country.nationalLengths.includes(digits.length)) {
    return 'Некорректный номер для выбранной страны';
  }
  return null;
}

export function buildE164(iso: string, nationalDigits: string): string {
  const country = getPhoneCountry(iso);
  const digits = nationalDigits.replace(/\D/g, '');
  if (!country || !digits) return '';
  return `+${country.dial}${digits}`;
}

/** Проверка значения из скрытого поля `phone` (+код и цифры). */
export function validateE164Phone(value: string): string | null {
  const t = value.trim();
  if (!t) return 'Введите номер телефона';
  const normalized = t.startsWith('+') ? t : `+${t}`;
  const digits = normalized.slice(1).replace(/\D/g, '');
  if (!digits) return 'Введите номер телефона';

  const ordered = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of ordered) {
    if (digits.startsWith(c.dial)) {
      const national = digits.slice(c.dial.length);
      return validateNationalPhone(c.iso, national);
    }
  }
  return 'Некорректный номер';
}
