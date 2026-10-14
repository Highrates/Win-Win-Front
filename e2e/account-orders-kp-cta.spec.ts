import { test, expect } from '@playwright/test';

const enabled = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());
const hasSession = Boolean(process.env.PLAYWRIGHT_STORAGE_STATE?.trim());

/**
 * Smoke: вкладка «В работе» с опубликованным КП показывает CTA ответа.
 * Нужны PLAYWRIGHT_BASE_URL и PLAYWRIGHT_STORAGE_STATE (сессия клиента с заказом на согласовании).
 */
test.describe('account orders KP CTA smoke', () => {
  test.skip(!enabled || !hasSession, 'Set PLAYWRIGHT_BASE_URL + PLAYWRIGHT_STORAGE_STATE');

  test.use({
    storageState: process.env.PLAYWRIGHT_STORAGE_STATE,
  });

  test('work tab shows confirm / changes / reject when KP actions visible', async ({ page }) => {
    await page.goto('/account/orders?tab=work');
    const confirm = page.getByRole('button', { name: 'Подтвердить' });
    const changes = page.getByRole('button', { name: 'Запросить изменения' });
    const reject = page.getByRole('button', { name: 'Отклонить' });
    const anyKp = confirm.or(changes).or(reject);
    await expect(anyKp.first()).toBeVisible({ timeout: 15_000 });
  });
});
