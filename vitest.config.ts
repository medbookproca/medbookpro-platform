import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { '@': path.resolve(rootDirectory, 'apps/web/src') } },
  test: { include: ['**/*.test.{ts,tsx}'], environment: 'node' },
});
