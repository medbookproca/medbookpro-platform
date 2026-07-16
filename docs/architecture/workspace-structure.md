# Workspace structure

The pnpm workspace uses Turborepo to coordinate `apps/*` and `packages/*`. The web app owns the Next.js shell. The worker owns future background-job entry points. Shared packages remain intentionally small and private. Database, authentication, and permission packages define safe boundaries only; they do not imply an existing schema, identity system, or authorization engine.
