import { proxyPasswordResetPost } from '@/lib/passwordResetProxy';

export async function POST(request: Request) {
  return proxyPasswordResetPost(request, 'password-reset/verify');
}
