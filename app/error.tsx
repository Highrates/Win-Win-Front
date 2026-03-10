'use client';

/** Этап 11: Технические страницы — ошибка */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <h1>Ошибка</h1>
      <p>{error.message}</p>
      <button type="button" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
