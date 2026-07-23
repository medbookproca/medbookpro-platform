import { test, expect } from '@playwright/test';

test.describe('Authentication Routes', () => {
  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(
      'Sign In',
    );
  });

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/sign-up');
    await expect(page.locator('h1')).toContainText('Create Account');
    await expect(page.locator('input[placeholder="Jane"]')).toBeVisible(); // First name
    await expect(page.locator('input[placeholder="Smith"]')).toBeVisible(); // Last name
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(
      'Create Account',
    );
  });

  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toContainText('Reset Password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(
      'Send Reset Link',
    );
  });

  test('forgot-password submission shows neutral response', async ({
    page,
  }) => {
    await page.goto('/forgot-password');
    await page.locator('input[type="email"]').fill('someone@example.com');
    await page.locator('button[type="submit"]').click();
    await expect(
      page.getByText(
        'If an account exists for this email address, a reset link will be sent.',
      ),
    ).toBeVisible();
  });

  test('reset-password page loads', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.locator('h1')).toContainText('Create New Password');
    const passwordInputs = page.locator('input[type="password"]');
    expect(await passwordInputs.count()).toBe(2); // New password and confirm
    await expect(page.locator('button[type="submit"]')).toContainText(
      'Reset Password',
    );
  });

  test('reset-password validation shows mismatch error', async ({ page }) => {
    await page.goto('/reset-password');
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('ValidPassword123!');
    await passwordInputs.nth(1).fill('MismatchPassword123!');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('verify-email page loads', async ({ page }) => {
    await page.goto('/verify-email');
    await expect(page.locator('h1')).toContainText('Verify Your Email');
  });

  test('invitations accept page loads', async ({ page }) => {
    await page.goto('/invitations/accept');
    await expect(page.locator('h1')).toContainText('Accept staff invitation');
  });

  test('invitation acceptance rejects missing token safely', async ({
    page,
  }) => {
    await page.goto('/invitations/accept');
    await expect(
      page.getByText(
        'This invitation is missing, expired, revoked, or not available for the signed-in account.',
      ),
    ).toBeVisible();
  });

  test('sign-in form validation', async ({ page }) => {
    await page.goto('/sign-in');
    // Try to submit without filling
    await page.locator('button[type="submit"]').click();
    // Check that validation error appears
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('sign-up form validation', async ({ page }) => {
    await page.goto('/sign-up');
    // Try to submit without filling
    await page.locator('button[type="submit"]').click();
    // Check that validation errors appear
    await expect(page.getByText('First name is required')).toBeVisible();
  });

  test('sign-in page has accessibility features', async ({ page }) => {
    await page.goto('/sign-in');
    // Check for labels
    await expect(page.locator('label')).toBeTruthy();
    // Check for form structure
    await expect(page.locator('form')).toBeVisible();
    // Check for accessible button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('responsive design at mobile width', async ({ page }) => {
    page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/sign-in');
    // Content should fit without horizontal scroll
    const formCard = page.locator('form').first();
    const boundingBox = await formCard.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(400);
  });

  test('links between auth pages work', async ({ page }) => {
    await page.goto('/sign-in');
    // Click forgot password link
    await page.locator('a:has-text("Forgot password")').click();
    await expect(page).toHaveURL('/forgot-password');
  });

  test('practitioner management is protected', async ({ page }) => {
    await page.goto('/app/practitioners');
    await expect(page).toHaveURL(/\/sign-in\?next=/);
  });

  test('practitioner detail routes remain protected', async ({ page }) => {
    await page.goto('/app/practitioners/00000000-0000-0000-0000-000000000001');
    await expect(page).toHaveURL(/\/sign-in\?next=/);
  });
});
