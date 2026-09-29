import { redirect } from 'next/navigation';

/** Заглушка: редактирование профиля — модалка на `/account/profile?profileEdit=1`. */
export default function EditProfilePage() {
  redirect('/account/profile?profileEdit=1');
}
