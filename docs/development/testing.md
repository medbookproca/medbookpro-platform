# Testing

Vitest runs package unit tests with `pnpm test`. Playwright is configured for a future browser smoke suite and can run with `pnpm test:e2e`; it is omitted from required CI because browser installation makes this foundation workflow unnecessarily heavy. CI runs lint, typecheck, unit tests, and build.
