# Phase 2D Practitioner Foundation Reconciliation

## Baseline and alignment

Phase 2D starts from `origin/main` at `9a77ccf`, after the Phase 2C staff invitation and membership work. ADR 0007 establishes that a practitioner is an organization-owned professional profile with an optional one-to-one Auth-user relationship. ADRs 0001, 0002, 0004, 0005, 0008, 0011, and 0012 require organization ownership, membership-based authorization, database-enforced isolation, separate Auth/profile identity, explicit location scope, archival over destructive deletion, and auditability.

## Reusable structures

- `organizations` and `locations` provide the tenant and operational-site boundaries; `clinics` remains a compatibility grouping.
- `profiles`, `organization_memberships`, `membership_roles`, and `membership_location_scopes` remain the only identity and authorization authorities.
- `roles`, `permissions`, `role_permissions`, `has_permission`, `has_location_access`, and `audit_events` are reused.
- Existing timestamp triggers, organization-aware composite foreign keys, Supabase SSR clients, server actions, shared Zod schemas, Vitest, Playwright, and local pgTAP conventions are reused.

## Domain boundaries

A practitioner is not a staff membership. A practitioner can exist before account activation, can be linked to at most one membership in the same organization, and can be unlinked without deleting the professional profile. The membership remains authoritative for authentication and permissions. The practitioner record is authoritative for professional lifecycle, locations, specialties, services, credentials, and future availability ownership.

The repository has no canonical service table yet. This phase adds a deliberately minimal organization service catalogue containing only name, description, status, and display order. Pricing, duration, buffers, booking rules, and scheduling remain out of scope.

## Proposed schema additions

- `practitioners`: organization-owned profile, optional membership link, lifecycle, internal display fields, and audit actors.
- `practitioner_location_assignments`: active/inactive location relationships, primary location, effective dates, booking visibility, and notes.
- `practitioner_credentials`: sensitive credential metadata and controlled verification state; no uploaded documents.
- `specialties` and `practitioner_specialty_assignments`: organization-safe catalogue and ordered/primary assignments.
- `services` and `practitioner_service_assignments`: minimum service eligibility foundation with optional location restriction.
- `practitioner_languages`: normalized language-code assignments.
- `practitioner_public_profiles`: private-by-default future publication fields and collision-safe organization slug.

All tenant-owned rows carry `organization_id`, timestamps, actor fields where relevant, and composite foreign keys that prevent cross-organization references. Partial unique indexes prevent duplicate active assignments and multiple active primary locations/specialties.

## Lifecycle and linkage

Practitioner status is `draft`, `active`, `inactive`, or `archived`. Draft records are not bookable; inactive and archived records retain history; archived records cannot be edited through ordinary profile updates. Status transitions are explicit RPCs and audited. Linking requires an active membership in the same organization and is unique per membership. Client-supplied profile or membership IDs are revalidated server-side.

## Credentials

Credential numbers are optional because professions differ. The model supports credential type, issuing body, number, jurisdiction, issue/expiry dates, verification status, verification actor/date, notes, document-reference placeholder, primary flag, and active status. Credential verification is a separate permission-controlled RPC and never accepts verification fields through direct table writes. Raw document storage and automated registry verification are excluded.

The PRD lists credential verification as future scope, while this phase prompt explicitly requests a flexible credential foundation and verification controls. The implementation resolves that conflict by adding the secure relational foundation and manual verification state only; it does not claim regulatory verification or public credential publication.

## Specialties, services, and locations

Specialties are organization-owned, archivable, optionally public, and assigned through an atomic replacement RPC. Service assignments reference only same-organization services and optional same-organization locations. Active practitioners may receive active assignments; inactive or archived practitioners cannot receive new active assignments. Location assignment replacement preserves removed assignment rows as inactive history and permits multiple active locations with at most one active primary.

## Public-profile readiness

Public profile data is separate from internal practitioner data and defaults to `private`/`hidden`. Slugs are unique within an organization, but no public route is added. Publication and booking visibility are explicit fields and permissions; internal credential numbers, notes, audit metadata, and linkage details are never part of the public model.

## Permissions and RLS

The existing allow-based permission model is extended with `practitioners.read`, `create`, `update`, `archive`, `manage_credentials`, `verify_credentials`, `manage_locations`, `manage_services`, `manage_public_profile`, and `link_membership`. Organization owner, organization admin, and clinic admin receive appropriate management permissions through the existing role-permission tables; ordinary practitioners receive read-only operational access only where explicitly mapped. Platform permissions remain non-assignable by organization administrators.

RLS is enabled on every new table. Reads require practitioner or service/specialty permissions and organization access. Direct writes are denied for sensitive and multi-table changes; trusted RPCs enforce `auth.uid()`, tenant consistency, lifecycle rules, and audit events. Public profile rows remain private to authenticated organization access until future publication infrastructure exists.

## RPC decisions

Sensitive operations use schema-qualified, hardened security-definer RPCs: create/update/status, membership link/unlink, location replacement, credential add/update/verify, specialty replacement, service replacement, language replacement, and public-profile update. Each function has restricted execute grants, safe search paths, stable validation errors, and actor identity derived from `auth.uid()`.

## UI and server boundaries

Protected routes are `/app/practitioners`, `/app/practitioners/new`, `/app/practitioners/[practitionerId]`, and `/app/practitioners/[practitionerId]/edit`. Server pages read through RLS; server actions validate shared schemas and invoke RPCs. No browser component receives a service-role client. Public practitioner pages are intentionally absent.

## Testing plan

Local pgTAP covers tenant isolation, authorization, lifecycle, archival protection, membership and location consistency, primary uniqueness, credential verification, specialty/service assignments, public visibility, suspended-member denial, and audit events. Unit tests cover schemas and pure lifecycle/visibility helpers. Server tests cover safe mutation boundaries. Playwright uses deterministic local routes and covers authorized creation, detail/edit flows, location/credential/specialty/public-profile updates, deactivation/archive, and unauthorized access behavior where the local auth harness supports it.

## Assumptions and open questions

- A practitioner has at most one linked organization membership; shared practitioner networks require a future reviewed model.
- The minimal service catalogue is a foundation only; a later service phase may extend it without changing practitioner identity.
- Credential verification is manual and internal until legal, privacy, and regulatory requirements are approved.
- Future public profiles require a separately reviewed publication/read model and route.
- Future scheduling must consume active practitioner-location/service assignments without treating them as availability.

No destructive migration, hosted-service change, production credential, clinical record, patient data, or deployment is required.
