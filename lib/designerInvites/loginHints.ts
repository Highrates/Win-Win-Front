export {
  DESIGNER_INVITE_DAILY_LIMIT,
  DESIGNER_INVITE_TTL_DAYS,
  DESIGNER_INVITE_TTL_LABEL,
  DESIGNER_PARTNER_LABEL,
  WINWIN_PROGRAM_LABEL,
} from './inviteLimits';

export const DESIGNER_INVITE_ERROR_CODE = {
  INVALID: 'invite_invalid',
  MISMATCH: 'invite_mismatch',
} as const;

export type DesignerInviteErrorCode =
  (typeof DESIGNER_INVITE_ERROR_CODE)[keyof typeof DESIGNER_INVITE_ERROR_CODE];

export const DESIGNER_INVITE_STAFF_EMAIL_ERROR =
  'Этот email принадлежит сотруднику Wupapa и не подходит для регистрации дизайнера-партнёра. Попросите приглашение на другой адрес.';

export const DESIGNER_INVITE_EXISTING_ACCOUNT_HINT =
  'Этот email уже зарегистрирован. Войдите в аккаунт, чтобы принять приглашение. Код на почту при регистрации не отправляется.';

export const REGISTER_EMAIL_OTP_FALLBACK_HINT =
  'Проверьте «Входящие» и «Спам». Если письма нет — возможно, аккаунт с этим email уже есть: войдите или восстановите пароль.';

export function formatDesignerInviteClaimError(
  message: string,
  inviteEmail?: string | null,
  code?: string | null,
): string {
  const email = inviteEmail?.trim().toLowerCase();
  if (!email) return message;
  if (code === DESIGNER_INVITE_ERROR_CODE.MISMATCH) {
    return `${message} Войдите с email из приглашения: ${email}.`;
  }
  return message;
}

/** Ошибка complete()/claim из-за недействительного или чужого designer invite. */
export function isDesignerInviteRegistrationError(code?: string | null): boolean {
  const c = (code ?? '').trim();
  return c === DESIGNER_INVITE_ERROR_CODE.INVALID || c === DESIGNER_INVITE_ERROR_CODE.MISMATCH;
}

export const DESIGNER_INVITE_DROPPED_HINT =
  'Приглашение больше недействительно. Можно завершить обычную регистрацию — привязки к пригласившему не будет.';

export const DESIGNER_INVITE_PHONE_ACCOUNT_HINT =
  'Если у вас аккаунт по телефону без email — войдите в него и добавьте email из приглашения в настройках. Иначе при регистрации по приглашению может появиться второй аккаунт.';

export function buildLoginWithInviteHref(params: {
  token: string;
  email?: string | null;
  existing?: boolean;
  staffError?: boolean;
  error?: string | null;
}): string {
  const q = new URLSearchParams();
  if (params.staffError) {
    q.set('designerInviteError', DESIGNER_INVITE_STAFF_EMAIL_ERROR);
    return `/login/email?${q.toString()}`;
  }
  q.set('designerInvite', params.token);
  const email = params.email?.trim();
  if (email) q.set('prefillEmail', email);
  if (params.existing) q.set('inviteExisting', '1');
  const err = params.error?.trim();
  if (err) q.set('designerInviteError', err);
  return `/login/email?${q.toString()}`;
}

export function buildRegisterWithInviteHref(params: {
  token: string;
  email?: string | null;
}): string {
  const q = new URLSearchParams();
  q.set('designerInvite', params.token);
  const email = params.email?.trim();
  if (email) q.set('prefillEmail', email);
  return `/register/email?${q.toString()}`;
}

/** После отброса недействительного приглашения — убрать токен и leftover ?ref=/r=. */
export function stripDroppedDesignerInviteParams(search: string | URLSearchParams): URLSearchParams {
  const q = new URLSearchParams(typeof search === 'string' ? search : search.toString());
  q.delete('designerInvite');
  q.delete('ref');
  q.delete('r');
  return q;
}

/** Только `t` — email сессии и приглашения mismatch-страница берёт на сервере. */
export function buildInviteMismatchPath(token: string): string {
  const q = new URLSearchParams();
  q.set('t', token.trim());
  return `/invite/designer/mismatch?${q.toString()}`;
}
