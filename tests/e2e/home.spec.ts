import { test, expect } from '@playwright/test';
test('home identifies MedBookPro', async ({ page }) => { await page.goto('/'); await expect(page.getByText('MedBookPro')).toBeVisible(); });
