# Environment variables

Copy `apps/web/.env.example` to `apps/web/.env.local` for the Next.js app. Next.js resolves `.env.local` relative to `apps/web`, not the monorepo root. Real values must never be committed; both root and app-level `.env.local` files are ignored.

## Browser-safe values

- `NEXT_PUBLIC_APP_URL` identifies the local application URL for documentation and future configuration.
- `NEXT_PUBLIC_SUPABASE_URL` is the Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the public publishable key used by `@supabase/ssr` and `@supabase/supabase-js`.

The URL and publishable key are intentionally browser-safe. The application validates them at client/server factory creation time and does not print their values.

## Prohibited values

Do not add `SUPABASE_SERVICE_ROLE_KEY`, a secret key, database password, JWT signing secret, or SMTP credential to browser code or `.env.example`. Service-role usage is not required in this phase and, if introduced in a future trusted server-only phase, must remain outside client modules and browser bundles.

For tests, use obvious local stubs such as `https://example.supabase.co` and `sb_publishable_test`; never use hosted project credentials or personal data.
