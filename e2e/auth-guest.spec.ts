import { test, expect } from '@playwright/test';

const enabled = Boolean(process.env.PLAYWRIGHT_BASE_URL?.trim());

test.describe('guest auth flows', () => {
  test.skip(!enabled, 'Set PLAYWRIGHT_BASE_URL to run against a live stack');

  test('login/email page renders and links to register/email', async ({ page }) => {
    await page.goto('/login/email');
    await expect(page.getByRole('heading', { name: /вход/i })).toBeVisible();
    const register = page.getByRole('link', { name: /зарегистрироваться/i });
    await expect(register).toHaveAttribute('href', /\/register\/email/);
  });

  test('register/email start step shows OTP request UI', async ({ page }) => {
    await page.goto('/register/email');
    await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /получить код/i })).toBeVisible();
  });

  test('register/phone start step is reachable', async ({ page }) => {
    await page.goto('/register/phone');
    await expect(page.getByRole('heading', { name: /регистрация/i })).toBeVisible();
  });

  test('forgot-password page renders', async ({ page }) => {
    await page.goto('/login/forgot-password');
    await expect(page.getByRole('button', { name: /отправить ссылку/i })).toBeVisible();
  });

  test('reset-password without token shows invalid link', async ({ page }) => {
    await page.goto('/login/reset-password');
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
