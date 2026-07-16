# MedBookPro

MedBookPro is a Canadian-first, multi-tenant healthcare clinic operating system. This repository currently contains the application and workspace foundation only; it does not implement healthcare workflows, patient records, authentication, or production infrastructure.

## Status

Initial platform workspace. Supabase directories are governance boundaries only, with no migrations or live project connection.

## Prerequisites

- Node.js 20.9 or newer
- pnpm 11

## Installation and commands

```sh
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Structure

`apps/web` is the Next.js App Router shell. `apps/worker` is a compileable background-process boundary. `packages/*` contains small shared boundaries for UI, configuration, database clients, authentication contracts, permissions, and utilities. `supabase/` contains governance documentation only.

## Environment handling

Copy `.env.example` to a local `.env`. Public values are allowed in browser bundles; `SUPABASE_SERVICE_ROLE_KEY` is trusted-server-only and must never be imported into browser code. Never commit real values.

## Security warning

Do not use production data in local development. This foundation intentionally makes no live database connection and adds no external provider credentials.

## Contribution

Read [local setup](docs/development/local-setup.md), [environment variables](docs/development/environment-variables.md), [testing](docs/development/testing.md), and [workspace structure](docs/architecture/workspace-structure.md) before contributing.
