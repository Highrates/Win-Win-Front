/** Просмотр личной коллекции по ссылке (token) */
export default function SharedCollectionPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <main>
      <h1>Коллекция по ссылке</h1>
      <p>Token: {searchParams.token || '—'}</p>
    </main>
  );
}
