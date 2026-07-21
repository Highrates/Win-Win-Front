'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBox } from '@/components/SearchBox/SearchBox';
import styles from './DesignersPage.module.css';

type Props = {
  initialQuery: string;
};

export function DesignersSearchBox({ initialQuery }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const debounced = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  return (
    <div className={styles.searchBox}>
      <SearchBox
        placeholder="Поиск по дизайнерам"
        ariaLabel="Поиск по дизайнерам"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          if (debounced.current) clearTimeout(debounced.current);
          debounced.current = setTimeout(() => {
            debounced.current = null;
            if (typeof window === 'undefined') return;
            const sp = new URLSearchParams(window.location.search);
            const t = v.trim();
            if (t) sp.set('q', t);
            else sp.delete('q');
            sp.delete('page');
            const qs = sp.toString();
            router.replace(qs ? `/designers?${qs}` : '/designers', { scroll: false });
          }, 380);
        }}
      />
    </div>
  );
}
