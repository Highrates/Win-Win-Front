import { redirect } from 'next/navigation';

/** Старый URL: приглашение дизайнера — модальное окно в профиле. */
export default function InviteDesignerRedirectPage() {
  redirect('/account/profile?tab=info&inviteDesigner=1');
}
