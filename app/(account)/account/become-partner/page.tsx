import { redirect } from 'next/navigation';

export default function BecomePartnerPage() {
  redirect('/account/profile?tab=info&partnerApply=1');
}
