import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Полный UI journey: register email OTP → complete → forgot → reset.
 * Мокает same-origin BFF (`/api/register/*`, `/api/password-reset/*`) — Nest не нужен.
 *
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -w win-win-web -- auth-registration-journey
 *
 * Без PLAYWRIGHT_BASE_URL — skip. Если на стенде включён Turnstile — skip (нужен живой виджет).
 */
const enabled = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installAuthJourneyMocks(page: Page) {
  await page.route('**/api/register/**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/email/start')) {
      await fulfillJson(route, { message: 'Код отправлен на email' });
      return;
    }
    if (path.endsWith('/email/verify')) {
      await fulfillJson(route, { completionToken: 'e2e-completion-token' });
      return;
    }
    if (path.endsWith('/complete')) {
      await fulfillJson(route, {
        ok: true,
        user: {
          id: 'u-e2e',
          email: 'journey@example.com',
          phone: null,
          role: 'USER',
          profile: { profileOnboardingPending: true },
        },
      });
      return;
    }
    await fulfillJson(route, { message: `Unhandled register path ${path}` }, 500);
  });

  await page.route('**/api/password-reset/**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/request')) {
      await fulfillJson(route, {
        message: 'Если аккаунт существует, мы отправили ссылку на email',
        sent: true,
      });
      return;
    }
    if (path.endsWith('/verify')) {
      await fulfillJson(route, { valid: true, email: 'journey@example.com' });
      return;
    }
    if (path.endsWith('/confirm')) {
      await fulfillJson(route, { ok: true, email: 'journey@example.com' });
      return;
    }
    await fulfillJson(route, { message: `Unhandled reset path ${path}` }, 500);
  });

  await page.route('**/api/user/logout', async (route) => {
    await fulfillJson(route, { ok: true });
  });
}

test.describe('auth registration → reset journey (API mocked)', () => {
  test.skip(!enabled, 'Set PLAYWRIGHT_BASE_URL to run against a live Next app');

  test('email OTP → password → forgot → reset confirm', async ({ page }) => {
    await installAuthJourneyMocks(page);

    await page.goto('/register/email');
    await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();

    if (await page.locator('iframe[src*="turnstile"], iframe[src*="challenges.cloudflare"]').count()) {
      test.skip(true, 'Turnstile enabled on this stack — journey needs captcha-free env');
    }

    await page.getByLabel(/^Email$/i).fill('journey@example.com');
    await page.getByLabel(/персональных данных/i).check();
    await page.getByRole('button', { name: /получить код/i }).click();

    await expect(page.getByRole('heading', { name: /подтверждение/i })).toBeVisible();
    await page.getByLabel(/код из письма/i).fill('424242');
    await page.getByRole('button', { name: /подтвердить/i }).click();

    await expect(page.getByRole('heading', { name: /задайте пароль/i })).toBeVisible();
    await page.getByLabel(/^Пароль$/i).fill('Password1');
    await page.getByLabel(/повторите пароль/i).fill('Password1');
    await page.getByRole('button', { name: /завершить регистрацию/i }).click();

    await page.waitForURL(/\/account\//, { timeout: 15_000 });

    await page.goto('/login/forgot-password');
    await page.getByLabel(/^Email$/i).fill('journey@example.com');
    await page.getByRole('button', { name: /отправить ссылку/i }).click();
    await expect(page.getByRole('status')).toContainText(/ссылк/i);

    await page.goto('/login/reset-password?t=e2e-reset-token');
    await expect(page.getByText(/новый пароль для/i)).toBeVisible();
    await page.getByLabel(/^Новый пароль$/i).fill('NewPass99');
    await page.getByLabel(/повторите пароль/i).fill('NewPass99');
    await page.getByRole('button', { name: /сохранить пароль/i }).click();

    await page.waitForURL(/\/login\/email/, { timeout: 15_000 });
    expect(page.url()).toMatch(/reset=ok/);
  });
});
