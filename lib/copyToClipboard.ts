/**
 * Копирование в буфер. На http (не localhost) `navigator.clipboard` часто недоступен — используем fallback.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  if (window.navigator.clipboard?.writeText) {
    try {
      await window.navigator.clipboard.writeText(text);
      return;
    } catch {
      /* fallback */
    }
  }
  await copyWithExecCommand(text);
}

function copyWithExecCommand(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.setAttribute('aria-hidden', 'true');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error('execCommand:copy'));
    } catch (e) {
      try {
        document.body.removeChild(ta);
      } catch {
        /* empty */
      }
      reject(e instanceof Error ? e : new Error('copy failed'));
    }
  });
}
