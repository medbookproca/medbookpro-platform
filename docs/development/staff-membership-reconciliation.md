# Staff invitations and membership reconciliation

## Current reusable structures

- `profiles` is linked to Supabase Auth and does not store global roles.
- `organizations` is the tenant boundary; `locations` belong to an organization and retain an existing `clinic_id` compatibility relationship.
- `organization_memberships` already links profiles to organizations and supports `invited`, `active`, `suspended`, and `revoked` states.
- `membership_roles` assigns existing system/custom roles to memberships.
- `membership_clinic_scopes` and `membership_location_scopes` provide the existing compatibility access model. Empty scope rows currently mean organization-wide access, including future locations.
- `invitations` already stores normalized email, target profile, hashed token digest, expiry, accepted/revoked metadata, and a JSON proposed-access boundary.
- Existing role and permission catalogue includes `staff.read`, `staff.invite`, `staff.manage`, `staff.suspend`, `roles.manage`, and `organizations.manage`.
- Existing security helpers and RLS provide active-membership, permission, clinic, and location checks.
- Existing audit events are append-oriented and prohibit direct client insertion.
- Existing `/invitations/accept` is a mock client flow and must be replaced with server-validated acceptance.

## Required schema additions

- Extend invitation and membership lifecycle metadata without rewriting historical migrations.
- Add structured invitation role assignments and selected-location assignments.
- Add invitation idempotency/resend metadata and cancellation metadata.
- Add membership removal metadata and a controlled `removed` compatibility state.
- Add stable indexes and cross-organization foreign keys.
- Add trusted lifecycle RPCs and restricted grants.

## Required schema changes

Existing `revoked` invitation/membership values remain readable for compatibility. New application transitions use `cancelled` for invitations and `removed` for memberships. The implementation must not hard-delete historical memberships or invitations. Existing empty-scope owner access remains a compatibility rule; Phase 2C documents it and keeps all access changes transactional.

## RLS implications

Invitation reads are limited to authorized staff in the invitation organization. Direct client inserts/updates for invitations, role assignments, location assignments, and membership role/scope mutations remain denied; trusted security-definer RPCs perform the atomic workflows. Staff profile reads are permitted only when the requesting user has `staff.read` in the target member’s organization. Existing tenant RLS and active-membership checks remain in force.

## API/RPC decisions

Use PostgreSQL security-definer RPCs for create, resend, cancel, preview, accept, role/access update, and membership status changes. Each function reads `auth.uid()`, sets an explicit safe search path, schema-qualifies sensitive objects, validates tenant/permission/state, locks the organization and target records where needed, writes audit events, and grants execution only to the intended authenticated role.

## Invitation lifecycle

`pending -> accepted`, `pending -> expired`, and `pending -> cancelled` are the supported transitions. Resend rotates the digest and expiry without creating a second pending invitation for the same organization/email. Accepted, expired, and cancelled invitations cannot be accepted again. Token material is returned only to the trusted server boundary for the development delivery adapter.

## Membership lifecycle

New acceptance creates an `active` membership. Existing compatibility states `invited`, `active`, `suspended`, and `revoked` remain valid for old data. New management transitions are `active -> suspended`, `suspended -> active`, and `active/suspended -> removed`; removed records retain history and lose access. Last active owner protection is enforced under an organization row lock.

## Role and location access rules

Roles resolve from stable keys and must belong to the organization or be system roles. `platform.super_admin` cannot be assigned by organization staff. Organization-wide access is represented by empty location-scope rows under the current compatibility model; selected access writes one row per validated same-organization location. All role and access changes replace assignments atomically and are audited.

## Ownership protections

An organization must retain at least one active membership with the `organization.owner` role. The last owner cannot be suspended, removed, or downgraded. Owner assignment/removal requires owner-level authority, and concurrent changes lock the organization before counting owners. Self-removal and self-suspension are blocked when they would violate this invariant.

## Audit events

The implementation records invitation created, resent, cancelled, accepted, expired where processed, membership activated/suspended/reactivated/removed, membership roles changed, membership location access changed, owner added/removed, and denied last-owner operations where the existing event model supports it. Raw tokens and secrets never enter metadata.

## UI surfaces

- `/app/settings/staff` provides authorized staff listing, pending invitations, role/access summaries, and membership actions.
- `/invitations/accept` becomes a server-validated authenticated acceptance flow.
- Invitation delivery remains a server-side development-safe boundary; production email provider integration is deferred.

## Testing plan

- pgTAP: tenant isolation, token digest/expiry, authorization, lifecycle transitions, role/access validation, ownership locking, audit, and suspended access.
- Unit: shared schemas, lifecycle/error helpers, access validation, and ownership guards.
- Server/component: authorized listings and all actions with safe errors.
- Playwright: owner invitation, acceptance, staff list, role/access update, suspend/reactivate, cancellation, last-owner protection, and unauthorized denial where deterministic local fixtures are available.

## Open questions

- Whether explicit organization-wide access should replace empty-scope compatibility in the next access migration.
- Whether custom roles are enabled in the first staff-management release.
- How unauthenticated invitees complete sign-up while preserving a token safely.
- Production transactional email provider, sender verification, and delivery retention.
- Final support/admin access and emergency ownership-transfer process.

## Conflicts and assumptions

No material conflict with accepted ADRs was found. The existing `clinics` compatibility layer, empty-scope all-location semantics, and `revoked` status values are preserved. The existing invitation acceptance mock is replaced because it is explicitly not a real authorization path. Supabase Auth remains the source of authenticated identity; no service-role key is used for normal onboarding or staff actions.
