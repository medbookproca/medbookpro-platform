# Testing

Vitest runs package unit tests with `pnpm test`. Packages without unit tests use Vitest's explicit `--passWithNoTests` mode; existing tests still run normally. Type-only packages expose typecheck tasks but no fake build outputs. Playwright is configured for browser smoke tests and can run with `pnpm test:e2e`; it uses explicit local Supabase stubs and does not send credentials, email, or requests to a hosted project. It is omitted from required CI because browser installation makes this foundation workflow unnecessarily heavy. CI runs lint, typecheck, unit tests, and build.
