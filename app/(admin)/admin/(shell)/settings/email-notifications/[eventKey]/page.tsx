import { EmailNotificationEditClient } from './EmailNotificationEditClient';

export default function AdminEmailNotificationEditPage({ params }: { params: { eventKey: string } }) {
  return (
    <main>
      <EmailNotificationEditClient eventKey={decodeURIComponent(params.eventKey)} />
    </main>
  );
}
