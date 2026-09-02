import { NextResponse } from 'next/server';

/**
 * Единый envelope ошибок **guest** auth BFF: login / register / password-reset / designer-invite verify.
 * Не использовать для admin login и `/api/user/session` — там остаётся `{ error }` / session shape.
 */
export type GuestAuthErrorBody = {
  message: string;
  code?: string;
};

export function guestAuthError(
  message: string,
  status: number,
  code?: string,
): NextResponse {
  const body: GuestAuthErrorBody = code ? { message, code } : { message };
  return NextResponse.json(body, { status });
}

export async function readUpstreamErrorMessage(res: Response): Promise<string | null> {
  try {
    const errBody = (await res.json()) as { message?: string | string[]; error?: string };
    if (Array.isArray(errBody.message)) return errBody.message.join(', ');
    if (typeof errBody.message === 'string' && errBody.message.trim()) return errBody.message;
    if (typeof errBody.error === 'string' && errBody.error.trim()) return errBody.error;
  } catch {
    /* empty */
  }
  return null;
}
