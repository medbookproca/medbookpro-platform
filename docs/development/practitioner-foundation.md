# Practitioner Foundation

Phase 2D adds the secure, tenant-isolated practitioner foundation without implementing appointments, availability, patient records, public directories, or production integrations.

## Domain boundaries

Practitioners are organization-owned professional profiles. They are distinct from Auth users, organization memberships, and staff records. A practitioner can exist without an account, can link to one active same-organization membership, and can later be unlinked safely. Membership roles and location scopes remain the authorization authority.

## Lifecycle

`draft` practitioners are not bookable. `active` practitioners can participate in future booking preparation. `inactive` practitioners retain history but cannot receive new active location or service assignments. `archived` practitioners retain references and are protected from ordinary edits; restoration is an explicit audited status transition.

## Database objects

The migration `20260723100000_add_practitioner_foundation.sql` adds:

- `practitioners`
- `practitioner_location_assignments`
- `practitioner_credentials`
- `specialties` and `practitioner_specialty_assignments`
- minimal `services` and `practitioner_service_assignments`
- `practitioner_languages`
- `practitioner_public_profiles`

Every tenant-owned object has an organization boundary. Composite foreign keys prevent cross-organization practitioner, membership, location, specialty, and service references. Partial unique indexes enforce one active primary location, specialty, credential, and language.

## RPCs and permissions

Protected RPCs cover practitioner creation/profile updates/status, membership link/unlink, locations, credentials and verification, specialties, services, languages, and public-profile readiness. They derive actors from `auth.uid()`, validate tenant consistency, restrict execute grants, and write redacted audit metadata.

The existing permission model is extended with:

- `practitioners.read`, `practitioners.create`, `practitioners.update`, `practitioners.archive`
- `practitioners.manage_credentials`, `practitioners.verify_credentials`
- `practitioners.manage_locations`, `practitioners.manage_services`
- `practitioners.manage_public_profile`, `practitioners.link_membership`

No parallel authorization system is introduced. Platform-super-admin remains non-assignable by organization administrators.

## Credentials

Credentials support optional registration numbers, issuing body, jurisdiction, dates, notes, document-reference placeholders, primary status, and `unverified`, `pending`, `verified`, `rejected`, or `expired` verification states. Numbers are never included in public-profile data and are not printed in application responses. Uploaded documents and automated verification are out of scope.

## Specialties and services

Specialties are organization-owned and archivable. Assignments support primary and display order while retaining inactive history. The service catalogue is intentionally minimal: name, description, status, and display order. Practitioner-service assignments support optional location restriction and active/inactive history; pricing, duration, buffers, booking visibility, and scheduling rules are future work.

## Location assignments

Practitioners may have multiple active locations and at most one active primary location. Location changes are atomic, same-organization validated, and preserve removed assignment history. Inactive and archived practitioners cannot receive new active assignments.

## Public-profile readiness

`practitioner_public_profiles` stores display name, title, biographies, voluntary pronouns/languages through the normalized language table, image-reference placeholder, acceptance preference, slug, SEO placeholders, and explicit `private`/`published` plus `hidden`/`visible` booking states. It defaults to private/hidden. No public route or booking page is launched.

## UI routes

- `/app/practitioners` — protected list with status and account-linkage summary.
- `/app/practitioners/new` — validated create form with optional membership, locations, specialties, and languages.
- `/app/practitioners/[practitionerId]` — detail and controlled lifecycle, location, credential, specialty, service, language, and profile-readiness actions.
- `/app/practitioners/[practitionerId]/edit` — safe internal profile editing.

All mutations use server actions and RPCs. Browser components never use a service-role client.

## Testing and development

Use synthetic local identities only:

```sh
supabase db reset --yes
supabase test db
supabase db lint
pnpm test
pnpm exec playwright test
```

The practitioner pgTAP suite covers authorization, tenant isolation, lifecycle, archival protection, membership linkage, locations, primary uniqueness, credentials, verification, specialties, services, public-profile visibility, suspended membership denial, and audit events. Shared unit tests cover schemas, lifecycle selectability, expiry display, and visibility defaults.

## Security, privacy, and Canadian extensibility

RLS is enabled on all practitioner tables. Direct writes are denied; sensitive verification fields require the verification RPC. Jurisdiction and credential types are free-form bounded fields so Canadian provinces and territories are supported without excluding other jurisdictions. No patient, clinical, uploaded credential, or regulatory-registry data is added.

## Future integration and rollback

Future availability and scheduling should consume active practitioner/location/service assignments but must implement separate availability and conflict rules. Public publication requires a reviewed read model and route. Rollback should use a reviewed forward migration or restore from a backup; do not drop practitioner tables while historical references exist. This migration is additive and does not modify previously merged migrations.

## Known limitations and open questions

- No email delivery, automated credential verification, document storage, public directory, or booking pages.
- The service catalogue is a foundation only and needs a later product decision for pricing and scheduling fields.
- Practitioner-to-membership is intentionally one-to-one per organization; shared practitioner networks require a new reviewed model.
- Credential verification remains manual pending legal, privacy, and regulatory review.
