# Local setup

Install Node.js 22.13 or newer and pnpm 11, then run `pnpm install`. If you use nvm, run `nvm use` to switch to the correct Node version. Copy `.env.example` to `.env` and add local Supabase URL and publishable-key values only when exercising real Auth flows. Use `pnpm dev` for the web shell. The web health endpoint is available at `/health` when the app is running.

The Auth boundary uses Supabase SSR cookies. Without local or development Supabase values, static pages and unit tests remain runnable, but sign-in, sign-up, callback, and protected-route requests fail clearly at runtime rather than contacting a hosted project implicitly. Local Supabase CLI/Docker integration is not required or configured in this phase.
