/** JWT покупателя после логина / регистрации (личный кабинет, корзина с авторизацией). */
export const USER_ACCESS_TOKEN_KEY = 'winwin_user_access_token';

export function setUserAccessToken(token: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(USER_ACCESS_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}
