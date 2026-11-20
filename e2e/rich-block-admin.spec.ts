import { expect, test, type Page } from '@playwright/test';

/**
 * Smoke RichBlock в админке (underline + link dialog).
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 \
 *   PLAYWRIGHT_ADMIN_EMAIL=… PLAYWRIGHT_ADMIN_PASSWORD=… \
 *   npx playwright test e2e/rich-block-admin.spec.ts
 */
const base = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());
const email = process.env.PLAYWRIGHT_ADMIN_EMAIL?.trim() ?? '';
const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD?.trim() ?? '';
const creds = Boolean(email && password);

async function adminLogin(page: Page) {
  await page.goto('/admin/login');
  await page.getByLabel(/e-?mail|почта/i).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /войти|sign in/i }).click();
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 30_000 });
}

async function assertRichBlockFormatSmoke(page: Page) {
  const underline = page.getByTitle('Подчёркивание');
  await expect(underline).toBeVisible({ timeout: 20_000 });
  await underline.click();
  await expect(underline).toHaveAttribute('aria-pressed', 'true');

  await page.getByTitle('Ссылка').click();
  const dialog = page.getByRole('dialog', { name: 'Ссылка' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('URL')).toBeVisible();
  await dialog.getByRole('button', { name: 'Отмена' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('RichBlock admin smoke', () => {
  test.skip(!base, 'Set PLAYWRIGHT_BASE_URL');
  test.skip(!creds, 'Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD');

  test('blog/new: underline + link dialog', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/blog/new');
    await assertRichBlockFormatSmoke(page);
  });

  test('catalog product/new: underline + link dialog', async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/catalog/products/new');
    await assertRichBlockFormatSmoke(page);
  });
});
