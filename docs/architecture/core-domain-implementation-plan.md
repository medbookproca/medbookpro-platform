# Core Domain Implementation Plan

This plan follows Phase 2A architecture documentation. Each phase requires reviewed migrations, RLS policies, application services, UI, tests, and rollback planning. No phase below is implemented by this branch.

## Phase 2B — Organization and location onboarding

- **Migrations:** add approved organization display/locale/currency/onboarding fields; normalize location fields; decide treatment of `clinics`.
- **RLS:** preserve organization ownership; add owner/admin-only onboarding writes; test cross-tenant inserts and updates.
- **Application services:** create organization, create location, archive location, transfer ownership primitives.
- **UI:** organization-first or location-first onboarding according to founder decision; no patient data.
- **Tests:** transaction invariants, slug uniqueness, owner safeguards, RLS isolation, archive behavior.
- **Rollback:** keep additive fields nullable initially; use feature flags and reversible onboarding state transitions.
- **Dependencies:** founder decisions 1–2 and existing identity helpers.

## Phase 2C — Membership-location access and owner provisioning

- **Migrations:** explicit lifecycle states, membership uniqueness rules, explicit organization-wide/selected access model, location grants, owner protections.
- **RLS:** active membership plus permission plus location scope; test revocation and future-location behavior.
- **Application services:** invitation acceptance, activate/suspend/revoke membership, grant/revoke location access, ownership transfer.
- **UI:** staff and access management screens; invitation flows only after security review.
- **Tests:** last-owner safeguards, re-invitation, expiry, scope escalation prevention, session behavior after revocation.
- **Rollback:** dual-read current scope semantics while backfilling explicit access modes; preserve old rows until verified.
- **Dependencies:** founder decisions 3–5, identity invitation tables, Auth callback.

## Phase 2D — Practitioner foundation

- **Migrations:** practitioner profiles, optional Auth link, practitioner-location relationships, status/effective dates, minimal credentials.
- **RLS:** organization ownership; location visibility; staff/practitioner self-service permissions.
- **Application services:** create/update/deactivate practitioner, link/unlink Auth user, assign location.
- **UI:** practitioner directory and profile setup; no clinical credentials documents initially.
- **Tests:** one-user/one-practitioner link, multi-location work, deactivation history, cross-tenant denial.
- **Rollback:** additive tables with no appointment foreign keys until verified; retain deactivated rows.
- **Dependencies:** Phase 2B/2C, credential decision 11.

## Phase 2E — Patient foundation

- **Migrations:** organization-owned patient, identifiers, contacts, consent markers, archive/merge history.
- **RLS:** organization boundary and permission-controlled access; location is contextual, never ownership.
- **Application services:** patient creation, duplicate search, correction/export, archive, merge workflow.
- **UI:** patient registration and search only after privacy review; no clinical notes.
- **Tests:** cross-tenant denial, duplicate detection, merge history, consent, retention lock, audit completeness.
- **Rollback:** do not expose patient UI until RLS and retention tests pass; use additive tables and reversible feature flags.
- **Dependencies:** founder decisions 7–8, Canada privacy/legal review, Phase 2B access.

## Phase 2F — Services and appointment foundation

- **Migrations:** services, location-service overrides, practitioner-service eligibility, appointments, status history, UTC/timezone fields.
- **RLS:** organization ownership plus location access and permission; appointment visibility must be PostgreSQL-enforced.
- **Application services:** availability checks, appointment create/reschedule/cancel/status transition, timezone conversion.
- **UI:** service catalog and basic appointment scheduling; recurring schedules deferred.
- **Tests:** overlap/availability, UTC conversion, archival references, cancellation/no-show history, cross-tenant denial.
- **Rollback:** write new appointment status history alongside existing fields; release read-only views before writes.
- **Dependencies:** practitioner/patient foundations, service policy, timezone decisions.

## Phase 2G — Subscription entitlements and audit expansion

- **Migrations:** subscription account, trials, entitlements, limits, grace periods, expanded audit subjects/source/correlation fields.
- **RLS:** billing-owner boundary separate from operational authorization; audit reads permission-controlled and writes append-only.
- **Application services:** entitlement evaluation, plan transition, grace/suspension, export/audit query services.
- **UI:** billing and audit administration; no card data collection in MedBookPro tables.
- **Tests:** entitlement limits, grace periods, organization suspension, audit metadata redaction, support access trails.
- **Rollback:** provider references remain opaque; preserve prior entitlement snapshots and make enforcement changes feature-flagged.
- **Dependencies:** enterprise billing decision 6, support access decision 10, financial retention policy.

## Cross-phase release gates

Every phase requires reviewed schema diagrams, migration immutability, RLS tests for same- and cross-tenant scenarios, audit review, privacy/security review, rollback rehearsal, and documentation updates. Hosted Supabase changes are performed only through approved reviewed migrations and release procedures.
