import { test, expect } from '@playwright/test';

const enabled = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());
const hasSession = Boolean(process.env.PLAYWRIGHT_STORAGE_STATE?.trim());

/**
 * Smoke / deep-link: вкладка «В работе», KP CTA, URL sync.
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

  test('opening order details writes tab+order to URL and clears on close', async ({ page }) => {
    await page.goto('/account/orders?tab=work');
    const details = page.getByRole('button', { name: /Подробнее/i }).first();
    await expect(details).toBeVisible({ timeout: 15_000 });
    await details.click();
    await expect(page).toHaveURL(/tab=work/);
    await expect(page).toHaveURL(/[?&]order=/);
    await page.getByRole('button', { name: 'Закрыть' }).first().click();
    await expect(page).toHaveURL(/tab=work/);
    await expect(page).not.toHaveURL(/[?&]order=/);
  });

  test('deep-link ?order= without tab opens work tab modal', async ({ page }) => {
    await page.goto('/account/orders?tab=work');
    const details = page.getByRole('button', { name: /Подробнее/i }).first();
    await expect(details).toBeVisible({ timeout: 15_000 });
    await details.click();
    const url = new URL(page.url());
    const orderId = url.searchParams.get('order');
    test.skip(!orderId, 'No order card available to derive deep-link id');
    await page.goto(`/account/orders?order=${encodeURIComponent(orderId!)}`);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/order=/);
  });

  test('sourcing cards do not expose archive menu', async ({ page }) => {
    await page.goto('/account/orders?tab=work');
    await page.waitForTimeout(800);
    const sourcingChip = page.getByText('Подбор', { exact: true }).first();
    if ((await sourcingChip.count()) === 0) {
      test.skip(true, 'No sourcing cards in work feed');
      return;
    }
    await expect(sourcingChip).toBeVisible();
    const card = sourcingChip.locator(
      'xpath=ancestor::*[contains(@class,"orderWrapper") or contains(@class,"orderCard")][1]',
    );
    await expect(card.getByRole('button', { name: /Действия по/i })).toHaveCount(0);
  });
});
