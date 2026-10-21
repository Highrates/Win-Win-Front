/** Согласовано с лимитом в DesignerInviteService.sendInvite. */
export const DESIGNER_INVITE_DAILY_LIMIT = 100;

export const DESIGNER_INVITE_STAFF_EMAIL_ERROR =
  'Этот email принадлежит сотруднику Wupapa и не подходит для регистрации партнёра. Попросите приглашение на другой адрес.';

export const DESIGNER_INVITE_EXISTING_ACCOUNT_HINT =
  'Этот email уже зарегистрирован. Войдите в аккаунт, чтобы принять приглашение. Код на почту при регистрации не отправляется.';

export const REGISTER_EMAIL_OTP_FALLBACK_HINT =
  'Проверьте «Входящие» и «Спам». Если письма нет — возможно, аккаунт с этим email уже есть: войдите или восстановите пароль.';

export function formatDesignerInviteClaimError(message: string, inviteEmail?: string | null): string {
  const email = inviteEmail?.trim().toLowerCase();
  if (!email) return message;
  if (message.includes('не подходит')) {
    return `${message} Войдите с email из приглашения: ${email}.`;
  }
  return message;
}

export function buildLoginWithInviteHref(params: {
  token: string;
  email?: string | null;
  existing?: boolean;
  staffError?: boolean;
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
  return `/login/email?${q.toString()}`;
}
