/** Ошибка загрузки данных ЛК с текстом для пользователя (без «HTTP 500» и технических сообщений). */
export class AccountLoadError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'AccountLoadError';
  }
}

/** `status: null` — сеть недоступна / запрос не дошёл; `undefined` — причина неизвестна. */
export function accountLoadErrorMessage(status: number | null | undefined, subject: string): string {
  if (status === 401 || status === 403) return 'Сессия истекла. Войдите в аккаунт снова.';
  if (status === 429) return 'Слишком много запросов. Подождите немного и попробуйте ещё раз.';
  if (status === null) return `Не удалось загрузить ${subject}: нет связи с сервером. Проверьте интернет и попробуйте ещё раз.`;
  return `Не удалось загрузить ${subject}. Попробуйте ещё раз — если ошибка повторится, напишите нам.`;
}

export function accountLoadErrorText(e: unknown, subject: string): string {
  if (e instanceof AccountLoadError) return e.message;
  return accountLoadErrorMessage(undefined, subject);
}
