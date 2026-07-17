# MedBookPro Core Domain Model

## Status and scope

This document defines the Phase 2A conceptual and logical model for the core multi-tenant domain. It is an architecture specification only. It does not create migrations, tables, RLS policies, onboarding UI, patient records, or hosted Supabase changes.

The existing identity database is treated as implemented reality. Where its names or constraints differ from this model, the difference is recorded as a reconciliation item rather than silently changed.

## Domain overview

MedBookPro has one primary tenant boundary: an **organization**. An organization is the legal, commercial, or operating entity that owns its locations, practitioners, patients, services, and appointments. A location is a physical or virtual clinic site operated by one organization.

The existing schema contains `clinics` between organizations and locations. In this model, **clinic is not a synonym for organization or location**. Until a reviewed migration changes the schema, `clinics` is treated as a legacy operating-group aggregate that may group locations inside an organization. Product language should use “organization” for the tenant and “location” for the site.

Identity, authorization, healthcare operations, and commercial billing are separate boundaries:

1. Supabase Auth owns credentials and sessions.
2. Profiles and memberships own application identity and access relationships.
3. Organizations own tenant data.
4. Roles and permissions express access; role names do not authorize by themselves.
5. Subscription accounts own commercial entitlements, not data authorization.
6. Audit events record security-sensitive and healthcare-sensitive actions without storing secrets or clinical content.

## Canonical terminology

| Term | Meaning | Not to be confused with |
| --- | --- | --- |
| Organization | Top-level tenant, legal/business operating entity, or account boundary | A physical clinic site |
| Location | Physical or virtual site operated by one organization | The organization itself |
| Clinic | Existing schema grouping under an organization; retained only as a compatibility term until reviewed | The canonical tenant or site term |
| Membership | A user’s relationship to one organization, including status and lifecycle | A global user role |
| Location access | The locations a membership may access | Practitioner-location association |
| Practitioner | Organization-owned professional profile optionally linked to one Auth user | A user account or patient |
| Patient | Organization-owned person receiving care | An Auth user or practitioner-owned record |
| Service | Bookable organization service template | An appointment instance |
| Appointment | Scheduled service occurrence for a patient, practitioner, location, and time period | A recurring-series definition |
| Subscription account | Commercial billing relationship for plans and entitlements | An authorization boundary |

## Aggregate boundaries

### Identity aggregate

Supabase `auth.users` is the credential and session authority. `public.profiles` is the application profile linked one-to-one by Auth user ID. Auth metadata is not an authorization or credential store.

### Organization aggregate

An organization owns its organization settings, locations, practitioners, patients, services, appointments, and tenant-scoped audit events. An organization may exist before its first location so account creation and onboarding can be staged safely.

### Access aggregate

A membership belongs to exactly one organization and one profile. Role assignments attach to memberships. Location access is subordinate to the membership’s organization and is independently auditable.

### Practitioner aggregate

A practitioner profile belongs to one organization and can be linked to at most one Auth user. Practitioner-location and practitioner-service relationships are separate from membership access and support cross-location work.

### Patient aggregate

A patient belongs to exactly one organization in v1. Patients are not owned by practitioners or locations. Location attendance and appointment history provide operational context without changing patient ownership.

### Scheduling aggregate

Services are organization-owned templates. Location-service and practitioner-service relationships define availability and eligibility. Appointments snapshot enough operational context to preserve history when related records are later archived.

### Commercial aggregate

A subscription account owns plan, trial, status, and entitlement state. A v1 account is associated with one organization. A future join model may allow one commercial account to cover multiple organizations without making a payment-provider ID an authorization key.

## Entity descriptions and rules

### Organizations

Conceptual fields:

- `id` — immutable UUID.
- `legal_name` — legal entity name where applicable.
- `display_name` — operating/product-facing name.
- `slug` — unique, normalized URL identifier.
- `status` — `active`, `suspended`, `archived`, or `deleted` only where policy permits.
- `country_code` — default `CA` for Canada-first operation.
- `default_timezone` — IANA timezone, not a province abbreviation.
- `default_currency` — default `CAD`.
- `locale` — default Canadian English or French locale as configured.
- `business_number` and jurisdiction-specific business identifiers where justified.
- `branding_settings` — safe presentation configuration, not authorization.
- `onboarding_state` — explicit lifecycle state separate from active/suspended status.
- `subscription_account_id` — commercial ownership reference, not a permission grant.
- `created_at`, `updated_at`, `archived_at`, and archival actor fields.

Rules:

- An organization may exist without a location.
- A user may belong to multiple organizations through separate memberships.
- Ownership transfer is a membership role change requiring last-owner safeguards and an audit event.
- Suspension stops application access without deleting healthcare or financial history.
- Parent groups, franchises, and enterprise portfolios are reserved for a future organization relationship model.

### Locations

Conceptual fields:

- organization ownership, immutable `organization_id`;
- `name` and organization-unique `code`;
- `kind`: `physical` or `virtual`;
- address, city, province/territory, postal code, and country code;
- timezone, phone, and operational email;
- operational status and booking availability;
- public booking visibility;
- branding overrides;
- created, archived, and archival actor timestamps.

Every location belongs to exactly one organization in v1. A location cannot be moved across organizations through an ordinary update. A transfer, if ever required, is a reviewed domain operation with explicit audit and historical rules.

### Memberships and location access

A membership is unique per profile and organization for the active lifecycle. Recommended lifecycle states are `invited`, `active`, `suspended`, `deactivated`, `left`, and `revoked`. `invited` is not authenticated access; `suspended`, `deactivated`, `left`, and `revoked` lose application access promptly.

Organization-wide administration and location-restricted work are distinct:

- Organization-wide access is an explicit, auditable access mode that applies to current and future locations.
- Selected access is represented by explicit membership-location grants.
- Temporary access has an expiry and reason.
- Revocation records who revoked access, when, why, and the affected scope.
- Re-invitation creates a new invitation lifecycle while preserving prior membership and audit history.
- The last active organization owner cannot be suspended, deactivated, or removed without a reviewed ownership-transfer operation.

The current schema’s empty-scope convention means organization-wide access. That behavior must be treated as a compatibility rule only; future implementation should make the organization-wide mode explicit rather than infer it from missing rows.

### Roles and permissions

The existing allow-based `domain.action` permission model remains authoritative. Missing permission means deny; there is no explicit deny layer in v1.

Initial role catalog:

- `organization_owner`
- `organization_admin`
- `clinic_manager` — legacy/group-scoped compatibility role where required
- `practitioner`
- `receptionist`
- `billing_staff`
- `read_only_auditor`

Roles are bundles, not authorization decisions. The model supports system roles, organization custom roles, and future location-scoped role assignments. Permission keys are versioned data or controlled application constants, and changes require audit events and compatibility review. Owner-only operations include transferring ownership, deleting or archiving the organization, changing subscription ownership, and granting emergency support access.

Emergency support access is temporary, least-privilege, consented where policy requires, and fully audited. It must never be implemented as a hidden service-role shortcut.

### Practitioners

A practitioner profile is organization-owned and separate from Auth identity. It may link to one Auth user, but a profile can remain historically referenced after the user is deactivated.

Conceptual fields include status, professional title, credentials, registration/licence jurisdiction and identifier, specialties, bio, pronouns only if product-relevant, booking visibility, and archival markers. Sensitive credential material must not be placed in editable user metadata; storage and access require a later security and privacy review.

`practitioner_locations` supports one practitioner working at multiple locations. It carries location-specific status, schedule references, booking visibility, and effective dates. Practitioner membership access remains a separate concern.

### Patients

Patients belong to one organization and may attend multiple locations. A patient is distinct from an Auth user; optional portal linkage is a future relationship, not an assumption. Practitioners never own patient records.

The future patient record boundary includes legal name, preferred name, date of birth, contact details, address, communication preferences, consent status, emergency contact, organization patient number, portal linkage, archived/deceased state, merge history, retention markers, and duplicate-detection identifiers.

Clinical notes, medical records, diagnostic data, and attachments are explicitly outside Phase 2A. When added, their organization ownership and PostgreSQL enforcement must be explicit on the record or through a structurally short, tested ownership path.

### Services

An organization service is the bookable template. It includes name, category, default duration, buffer time, base price, tax behavior, currency, modality, active status, public booking visibility, and future billing/insurance code references.

- Organization service fields define the default commercial and operational contract.
- Location-service fields override availability, local price, duration, modality, and public visibility where needed.
- Practitioner-service fields define eligibility, effective dates, and practitioner-specific overrides.

No service row should imply that every practitioner or location may offer it. Availability and eligibility are explicit relationships.

### Appointments

An appointment belongs to one organization and references a patient, practitioner, location, and service. Initial statuses are `requested`, `confirmed`, `checked_in`, `in_progress`, `completed`, `cancelled`, and `no_show`.

Store appointment instants as UTC `timestamptz` values and retain the operational IANA timezone used when scheduling. Display uses the location timezone by default, with an explicit user-timezone preference where appropriate. Recurring appointments are reserved for a future series/occurrence model.

Immutable or append-only facts include organization ownership, original booking actor/source, original start/end instants, and audit history. Status, rescheduling, cancellation reason, notes intended for scheduling operations, and selected operational fields may change through audited transitions. Related records may be archived without invalidating historical appointments.

### Subscription accounts, trials, and entitlements

A subscription account contains plan, trial state, billing status, provider customer reference, entitlement set, seat/location limits, grace period, and suspension behavior. It is commercially related to an organization but does not grant access to one.

Payment card data is never stored. Provider IDs are opaque references and cannot be used as tenant authorization keys. A v1 subscription covers one organization; a future commercial-account-to-organizations join can support enterprise plans without changing healthcare ownership.

### Invitations

Invitations are organization-owned, single-use lifecycle records with normalized email, target profile where known, proposed access, inviter, expiry, acceptance/revocation timestamps, and a token digest. Invitation acceptance must create or activate a membership through a reviewed service; it must not trust client-provided roles or scopes.

### Audit events

Audit events record actor, organization, optional clinic compatibility reference, location, action, subject type/ID, timestamp, request/correlation ID, source, outcome, security-event marker, safe metadata, and before/after values where appropriate.

Required audit categories include organization changes, role/permission changes, invitations, practitioner access, patient access, appointment changes, exports, login/security events, and support/impersonation access. Passwords, tokens, secrets, and unnecessary clinical content are prohibited in metadata.

## Tenant ownership matrix

The authoritative table is [tenant-ownership-matrix.md](tenant-ownership-matrix.md). In summary, every operational record is organization-owned; location scope never broadens organization scope; profiles are user-scoped; permissions may be global reference data; subscriptions are commercial records; and audit events retain tenant context where available.

## Lifecycle, deletion, and archival rules

- Organizations: suspend or archive; never casually hard-delete when healthcare or financial history exists.
- Locations: archive and remove from new booking; preserve historical references.
- Memberships: transition status; preserve lifecycle and audit history.
- Practitioners: deactivate/archive; preserve historical appointment references.
- Patients: archive or anonymize only under approved retention, legal-hold, and correction workflows.
- Services: deactivate/archive; preserve appointment snapshots.
- Appointments: preserve as auditable history; correct through status transitions or append-only amendments.
- Audit events: append-oriented retention with retention locks and legal holds; no ordinary user deletion.
- Subscription records: preserve billing and entitlement history according to financial retention policy.

Hard deletion is reserved for non-operational configuration or failed pre-activation records after policy review. Soft deletion is not a substitute for access revocation. Archive state must be included in RLS and application query policy.

## Tenant isolation and security

Every sensitive domain table should carry `organization_id` directly where practical. RLS must enforce organization ownership first, then membership status, permission, and location scope. Patient and appointment reads must be denied by PostgreSQL, not only by application filters. Cross-tenant joins should require explicit same-organization constraints and short ownership paths.

The current helpers (`current_profile_id`, `has_active_membership`, `has_organization_access`, `has_clinic_access`, `has_location_access`, and `has_permission`) establish the identity/access pattern. Future domain tables must use reviewed helper semantics and synthetic cross-tenant tests. Supabase service-role access is trusted infrastructure access, not application-user authorization.

## Canada-first and international expansion

- Default country and currency are Canada and CAD, while remaining configurable.
- Use IANA timezones and province/territory-aware addresses.
- Keep residency and regional deployment choices outside the logical tenant key.
- Support PIPEDA-aligned privacy operations, consent tracking, access logging, correction/export workflows, and breach investigation evidence.
- Reserve country, jurisdiction, currency, locale, tax, and regulatory extension points for international expansion.

This architecture does not claim legal compliance certification. Legal, privacy, security, clinical, and operational review is required before production use.

## Future white-label, enterprise, and franchise support

Parent organizations, franchise relationships, multi-brand settings, custom domains, enterprise subscription ownership, and cross-organization reporting are reserved extension points. They must not weaken the v1 rule that patient and operational records belong to exactly one organization.

## Reconciliation summary

The detailed classification is in [core-domain-reconciliation.md](core-domain-reconciliation.md). The highest-priority architectural conflict is the existing `clinics` intermediate layer and the current implicit all-location scope convention. Both are documented compatibility constraints, not changed in Phase 2A.

## Unresolved decisions

See [core-domain-open-questions.md](core-domain-open-questions.md) for founder decisions on clinic terminology, onboarding invariants, owner behavior, enterprise billing, patient identifiers, merge policy, and regional requirements.

## Implementation sequence

Future migration and delivery sequencing is defined in [core-domain-implementation-plan.md](core-domain-implementation-plan.md). No Phase 2B–2G migration is included in this branch.
