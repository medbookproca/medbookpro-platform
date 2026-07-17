# Testing

Vitest runs package unit tests with `pnpm test`. Packages without unit tests use Vitest's explicit `--passWithNoTests` mode; existing tests still run normally. Type-only packages expose typecheck tasks but no fake build outputs. Playwright is configured for a future browser smoke suite and can run with `pnpm test:e2e`; it is omitted from required CI because browser installation makes this foundation workflow unnecessarily heavy. CI runs lint, typecheck, unit tests, and build.
