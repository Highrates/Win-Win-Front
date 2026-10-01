import { redirect } from 'next/navigation';

/** Старый URL: приглашение дизайнера — модальное окно на /account/team. */
export default function InviteDesignerRedirectPage() {
  redirect('/account/team?inviteDesigner=1');
}
