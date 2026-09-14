'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './SearchPage.module.css';

export function SearchPageForm({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = q.trim().slice(0, 80);
    if (trimmed.length < 2) return;
    /* Client nav: только searchParams, без full reload / SiteLoader */
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form className={styles.form} role="search" onSubmit={onSubmit}>
      <label className={styles.srOnly} htmlFor="search-page-q">
        Поиск по сайту
      </label>
      <input
        id="search-page-q"
        className={styles.formInput}
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Товар, категория, бренд, зона, коллекция или блог"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        minLength={2}
        maxLength={80}
      />
      <button type="submit" className={styles.formSubmit}>
        Найти
      </button>
    </form>
  );
}

export function SearchRetryButton() {
  const router = useRouter();
  return (
    <button type="button" className={styles.retryBtn} onClick={() => router.refresh()}>
      Повторить
    </button>
  );
}
