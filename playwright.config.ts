import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests/e2e', webServer: { command: 'pnpm --filter @medbookpro/web dev', url: 'http://localhost:3000', reuseExistingServer: true } });
