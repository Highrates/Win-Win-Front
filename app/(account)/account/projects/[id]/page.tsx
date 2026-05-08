import { redirect } from 'next/navigation';

/** Отдельной страницы проекта нет — список и переключатель табов на `/account/projects`. */
export default function AccountProjectLegacyIdRedirect() {
  redirect('/account/projects');
}
