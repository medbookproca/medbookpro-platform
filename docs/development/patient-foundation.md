# Patient Foundation

## Architecture and data model

Patients are canonical organization-owned records separate from Supabase Auth. A patient does not need an account and cannot cross organizations. The foundation includes normalized profile and lifecycle data, one contact/communication record, multiple protected identifiers, emergency contacts, future-ready relationships, versioned consents, insurance placeholders, referral readiness, and advisory duplicate flags.

The additive migration is `20260725100000_add_patient_foundation.sql`. It does not create appointments, encounters, clinical notes, diagnoses, medications, prescriptions, billing, claims, or portal accounts.

## Privacy and RLS

All patient-owned tables are organization-scoped and have RLS enabled. Authenticated direct writes are denied. Server-side RPCs validate `auth.uid()`, active membership permissions, organization ownership, patient lifecycle, and composite related-record ownership.

General patient profiles use `patients.read`. Identifiers require `patients.manage_identifiers`; emergency contacts, relationships, and insurance placeholders require `patients.manage_contacts`; consents require `patients.manage_consents`; duplicate flags require `patients.preview_duplicates`. Full identifier values are never selected by list/detail UI after entry; only last-four metadata is displayed.

## Permissions and audit

The migration adds `patients.read`, `patients.create`, `patients.update`, `patients.archive`, `patients.manage_consents`, `patients.manage_identifiers`, `patients.manage_contacts`, and `patients.preview_duplicates`. Existing organization owner/admin and operational role boundaries are reused; local practitioner seed access includes general patient profile read without protected identifier access.

Audited events include patient creation, updates, archive/restore, identifier add/update, consent changes, contact changes, communication preference changes, and duplicate flags. Audit metadata contains no identifier values, contact details, or clinical content.

## Duplicate detection

Duplicate preview compares same-organization legal/name normalization, date of birth, email, and normalized phone. Patient creation records advisory flags before inserting the new patient, preventing self-matches. There is no automatic merge, deletion, or overwrite workflow.

## Future integration

Future scheduling may reference this patient record and existing practitioner availability, but no scheduling foreign key or booking logic exists here. Future clinical modules may retain archived patient references. The normalized model is intended as a mapping boundary for FHIR Patient/RelatedPerson resources and future provincial health identifiers, without connecting to provincial registries or health-information exchanges.

## UI

Protected routes are `/app/patients`, `/app/patients/new`, `/app/patients/[patientId]`, and `/app/patients/[patientId]/edit`. They provide list/search/filter, creation, profile editing, lifecycle actions, communication preferences, consent readiness, protected identifier entry, emergency contacts, and duplicate warning indicators. No appointment or clinical history view is present.

## Known limitations

- Insurance and referral tables are placeholders without claims or workflow RPCs.
- Guardian/caregiver relationships do not implement legal authority or family scheduling.
- Photo and document references are placeholders; no uploads are handled.
- Duplicate flags have no merge or resolution UI yet.
- Provincial health integrations, portal accounts, clinical documentation, and consent documents are future work.

## Rollback

The migration is additive and should be reviewed before any shared-environment application. Shared migrations are immutable after application; corrections require a follow-up migration. Rollback before shared use removes the migration and dependent application routes. No hosted Supabase project or production service was modified during this phase.
