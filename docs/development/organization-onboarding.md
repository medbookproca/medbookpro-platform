# Organization onboarding

Phase 2B provisions an authenticated user’s first organization and operating location. It does not create practitioners, patients, services, appointments, subscriptions, invitations, or custom roles.

## Flow

An authenticated user without an active organization membership visits `/onboarding`. The form collects the minimum organization and first-location data, with Canadian defaults (`CA`, `CAD`, `en-CA`, and `America/Edmonton`). Virtual locations do not require a street address. Successful provisioning redirects to `/app`; users with an active membership are redirected away from onboarding.

## Transaction boundary

`public.create_organization_with_first_location` is a security-definer PostgreSQL function. It reads `auth.uid()`, validates input, creates the organization, creates the compatibility clinic required by the existing schema, creates the first location, provisions the active membership and existing `organization.owner` system role, writes safe audit events, marks onboarding completed, and records the idempotency attempt in one transaction.

The browser never writes tenant tables directly and never supplies a user ID, role ID, or organization ID. The existing empty-scope convention provides the owner access to all current and future locations.

## Idempotency and slugs

The application creates one request key per form session. The database serializes a user/key pair with a transaction advisory lock and stores the completed result under a unique constraint. Replays return the original organization and location rather than creating duplicates. Organization slugs are normalized server-side and collision suffixes are assigned while holding a slug advisory lock.

## RLS and recovery

Direct organization, membership, role-assignment, and scope inserts are denied to authenticated clients. The onboarding RPC is the only Phase 2B provisioning path. Existing tenant read policies and active-membership checks remain in force.

Migrations are forward-only. A defective function or policy must be corrected with a reviewed follow-up migration, and application rollback should remove the onboarding entry point before database rollback planning. Invalid records must be quarantined or archived through an approved administrative workflow; no automatic destructive down migration is provided.

## Local validation

Use local Supabase only:

```sh
supabase start
supabase db reset
supabase test db
```

These commands must not be pointed at a hosted project. Hosted migration deployment is intentionally excluded from Phase 2B.

## Future work

Organization switching, additional locations, staff invitations, ownership transfer, practitioner onboarding, patient records, services, appointments, subscription entitlements, and production migration deployment remain future phases.
