# Patient Foundation Reconciliation

## Scope

Phase 2E establishes the canonical organization-owned patient record. It does not implement appointments, encounters, clinical documentation, diagnoses, medications, prescriptions, billing, claims, referrals workflow, patient portal accounts, or family scheduling.

## Reusable architecture

Patients use the existing organization, membership, permission, RLS helper, RPC, generated-type, and append-only audit boundaries. A patient is not an Auth user and does not require a membership or portal account. The patient record belongs to exactly one organization and related rows carry the same organization identifier through composite foreign keys.

Practitioners and availability remain separate domains. Future scheduling may reference a patient and practitioner in the same organization, then consume the existing availability preview. No appointment or booking foreign key is created in this phase. Future clinical modules may reference the archived patient identifier without hard deletion.

## Privacy and audit

Identifiers, emergency contacts, insurance placeholders, and consent records have narrower read permissions than general patient profiles. Direct authenticated writes are denied and protected RPCs validate the caller, organization permission, lifecycle, and related patient ownership. Audit metadata avoids identifier values, contact details, insurance numbers, and free-form clinical content.

## Lifecycle and duplicates

Patients move through draft, active, inactive, and archived states. Archival is soft and historical references remain valid; restore is explicit. Duplicate detection is advisory only: matching name/date-of-birth/contact combinations create flags and preview results. No automatic merge, deletion, or identity overwrite is performed.

## Future compatibility

The normalized names, date of birth, language, communication, identifiers, relationships, consents, and organization ownership fields provide a stable mapping boundary for future FHIR Patient/RelatedPerson resources. Provincial health numbers are placeholder identifiers only; no provincial registry or health-information exchange is connected. Consent versioning and document references are ready for future reviewed document integrations without storing uploads here.

## Assumptions and architectural conflicts

- Internal patient numbers are organization-unique and generated when not supplied.
- Contact and communication preferences are separated from the core profile but maintained as one organization-owned contact record for this foundation.
- Guardians and caregivers are represented as relationship rows; legal authority workflows are future work.
- Insurance and referral records are readiness placeholders with no claims or referral workflow.
- Accessibility notes and non-clinical notes are intentionally labeled placeholders; clinical notes do not belong in this schema.
- The product requirements defer clinical and scheduling modules, so no cross-domain appointment or encounter references are introduced now.
