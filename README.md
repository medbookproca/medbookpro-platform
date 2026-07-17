# MedBookPro

MedBookPro is a Canadian-first, multi-tenant healthcare clinic operating system. This repository contains the application foundation and a Phase 1 Supabase Auth boundary; it does not implement healthcare workflows, patient records, authorization, or production infrastructure.

## Status

Initial platform workspace with email/password Supabase Auth integration, cookie sessions, callback handling, and one protected verification route. No hosted Supabase project is configured by this repository.

## Prerequisites

- Node.js 22.13 or newer
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

`apps/web` is the Next.js App Router shell and contains the Supabase SSR boundary. `apps/worker` is a compileable background-process boundary. `packages/*` contains small shared boundaries for UI, configuration, database clients, authentication contracts, permissions, and utilities. `supabase/` contains identity database governance and local-development documentation.

## Environment handling

Copy `.env.example` to a local `.env`. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are used by the browser/server Auth clients. Service-role keys are not required and must never be imported into browser code. Never commit real values.

## Security warning

Do not use production data in local development. Auth requires a configured Supabase project only when running the real sign-in/sign-up flows; no service-role key, database password, external provider, or patient/clinic data is used.

## Contribution

Read [local setup](docs/development/local-setup.md), [environment variables](docs/development/environment-variables.md), [testing](docs/development/testing.md), and [workspace structure](docs/architecture/workspace-structure.md) before contributing.
