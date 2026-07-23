# Supabase Auth Foundation

## Scope

Phase 1 connects email/password sign-in and sign-up to Supabase Auth. It also adds cookie-based SSR sessions, a PKCE callback, verified server identity helpers, sign-out, middleware refresh, and the minimal protected `/app` route.

The implementation does not create profiles, organizations, clinics, memberships, roles, authorization rules, patient records, or application database writes.

## Client boundaries

- `apps/web/src/lib/supabase/client.ts` lazily creates one `createBrowserClient` instance using only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `apps/web/src/lib/supabase/server.ts` creates a request-scoped `createServerClient` using the async Next.js cookies API and is marked `server-only`.
- `apps/web/src/lib/supabase/middleware.ts` preserves request and response cookies while refreshing sessions with `auth.getClaims()`.
- No service-role key, secret key, database password, JWT secret, or token is imported by the web application.

## Authentication flows

### Sign-up

The existing sign-up schema and form call `signUp` through the Supabase adapter. A safe same-origin `/auth/callback?next=/app` URL is supplied for email confirmation, and the existing display name is sent as non-authoritative `display_name` metadata. No organization, profile, membership, or role is created. The user receives a neutral verification message.

### Sign-in

The existing sign-in schema and form call `signInWithPassword`. Invalid credentials and provider errors are mapped to safe messages. A relative `next` path is accepted only after same-origin path validation; external and malformed targets fall back to `/app`.

### Callback

`/auth/callback` requires a `code`, calls `exchangeCodeForSession`, and redirects only to a validated relative path. Missing codes and exchange failures go to `/sign-in?error=auth_callback_failed` without exposing provider details.

### Session refresh and verification

`src/middleware.ts` refreshes cookies for dynamic requests and excludes Next.js internals and common static assets. Server protection uses `auth.getClaims()` to verify identity and calls `auth.getUser()` only when a current user record is needed. `getSession()` is not used as proof of identity.

### Protected route and sign-out

`/app` requires a verified user server-side, displays only the authenticated email, and provides a server action that calls `signOut` and redirects to `/sign-in`.

## Testing strategy

Unit tests cover environment parsing, safe redirect rules, callback error-path validation, error mapping, and the Supabase adapter with a controlled typed test double. Playwright continues to test page rendering, validation, loading-safe form behavior, and navigation without real credentials or email delivery. A future local Supabase integration suite may be added without contacting production.

## Local configuration

Run `supabase status` and copy the local `API_URL` and `PUBLISHABLE_KEY` into `apps/web/.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Do not use the root `.env.local`, the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`, a hosted project URL, or a service-role key for normal signup, sign-in, middleware, or onboarding.

## Dashboard configuration

When a development Supabase project is approved, configure these manually in the Supabase Dashboard:

- Site URL: the canonical development application URL.
- Local redirect URL: `http://localhost:3000/auth/callback`.
- Preview/staging redirect URLs: the exact approved HTTPS callback URLs for each environment.
- Production redirect URL: the exact approved production callback URL.
- Email confirmation: enabled for development and production unless governance approves another setting.

Do not change hosted project settings from this repository.

## Explicit exclusions

The following remain unimplemented: password recovery backend, invitation acceptance backend, organization onboarding, clinic onboarding, membership provisioning, authorization, MFA, social login, production SMTP configuration, and any patient or clinic data access.
