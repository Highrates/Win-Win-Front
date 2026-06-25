const STORAGE_KEY = 'ww:accountOrders:sourcingPromptDismissed';

export function isSourcingWorkPromptDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissSourcingWorkPrompt(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}
