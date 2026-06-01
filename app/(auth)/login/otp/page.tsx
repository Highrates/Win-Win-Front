import { redirect } from 'next/navigation';

export default function LoginOtpRedirectPage() {
  redirect('/login/email');
}
