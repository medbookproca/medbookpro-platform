# Workspace structure

The pnpm workspace uses Turborepo to coordinate `apps/*` and `packages/*`. The web app owns the Next.js shell. The worker owns future background-job entry points. Shared packages remain intentionally small and private. Database, authentication, and permission packages define safe boundaries only; they do not imply an existing schema, identity system, or authorization engine.

The identity architecture is documented in [Atlas](../atlas/README.md), including the [tenancy model](../atlas/identity/tenancy-model.md), [database specification](../atlas/identity/database-specification.md), [roles and permissions](../atlas/identity/roles-and-permissions.md), and [RLS policy matrix](../atlas/identity/rls-policy-matrix.md). These are specifications only; they do not create migrations or connect to Supabase.
