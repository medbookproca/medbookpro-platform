# Local Supabase

This repository uses Supabase locally only for the identity database foundation. No hosted project is linked and no production credentials are required.

## CLI and Docker

Install the Supabase CLI using the official platform instructions and ensure Docker Desktop is running. Verify with `supabase --version` and `docker info`.

From the repository root:

```sh
supabase start
supabase db reset
supabase test db
supabase stop
```

`supabase start` launches local services from `supabase/config.toml`. `supabase db reset` reapplies immutable migrations and local seed data. The seed contains only permission and system-role catalogue data; tests create synthetic `.invalid` identities inside a rolled-back transaction.

Do not run `supabase link`, `supabase db push`, or any command targeting a hosted project for this task. Local generated state, temporary branches, credentials, and service keys must remain ignored and uncommitted.

## Secrets

Use CLI-generated local values only. Never commit `supabase status` secrets, database passwords, service-role keys, or hosted project identifiers. Production PHI and real user data are prohibited in local development.
