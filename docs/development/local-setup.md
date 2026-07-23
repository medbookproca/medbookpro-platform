# Local setup

Install Node.js 22.13 or newer and pnpm 11, then run `pnpm install`. If you use nvm, run `nvm use` to switch to the correct Node version. Next.js loads environment files from the application workspace, so copy `apps/web/.env.example` to `apps/web/.env.local` and fill in the local Supabase publishable key. The root `.env.local` is ignored and is not a substitute for the app-level file. Use `pnpm dev` for the web shell. The web health endpoint is available at `/health` when the app is running.

The Auth boundary uses Supabase SSR cookies. Without local or development Supabase values, static pages and unit tests remain runnable, but sign-in, sign-up, callback, and protected-route requests fail clearly at runtime rather than contacting a hosted project implicitly. Local Supabase CLI/Docker integration is not required or configured in this phase.

Before opening a change, run `pnpm docs:check` when updating operational documentation. The launch-readiness guides describe pilot controls but do not authorize a deployment or require production credentials locally.
