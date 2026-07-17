import { test, expect } from '@playwright/test';

test.describe('Organization onboarding', () => {
  test('anonymous users are redirected to sign in', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fonboarding$/);
  });
});
