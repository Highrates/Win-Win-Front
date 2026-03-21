'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { PhoneField } from '@/components/PhoneField';
import { validateE164Phone } from '@/lib/validation';
import styles from '@/components/AuthPageShell/AuthPageShell.module.css';

export function LoginPhoneForm() {
  const [phoneError, setPhoneError] = useState<string | null>(null);

  return (
    <form
      className={styles.authForm}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const phone = String(fd.get('phone') ?? '');
        const err = validateE164Phone(phone);
        setPhoneError(err);
        if (err) return;
      }}
    >
      <div className={styles.authFields}>
        <PhoneField
          error={phoneError ?? undefined}
          onPhoneChange={() => setPhoneError(null)}
        />
      </div>

      <Button type="submit" variant="primary">
        Получить код
      </Button>
    </form>
  );
}
