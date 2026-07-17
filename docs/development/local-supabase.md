# Local Supabase workflow

MedBookPro’s SQL migrations and pgTAP tests are intended to run against the repository’s local Supabase project only. Do not link to, reset, push to, or apply migrations against the hosted project during development.

## Commands

From the repository root:

```sh
supabase start
supabase db reset
supabase test db
supabase status
```

`supabase db reset` is acceptable only for the local Docker-backed project. It is not a production recovery command. The seed contains only deterministic fictional authorization fixtures and no credentials, patient data, or real clinic data.

## Migration review

Migrations are immutable after reaching a shared environment. Schema changes must be committed as forward-only reviewed migrations. Dashboard-created changes must be converted into reviewed repository migrations before they are shared. Production data must never be used for local development.

Phase 2B adds the organization onboarding transaction, its idempotency ledger, constraints, indexes, grants, and RLS changes. Hosted deployment is intentionally not performed. Future changes must include database isolation tests, including anonymous denial, cross-organization denial, suspended-membership denial, and security-definer boundary tests.

Canadian project governance, privacy review, retention, residency, and support-access decisions remain required before hosted deployment.
