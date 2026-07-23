# Clinical Foundation

## Architecture

The clinical foundation is organization-scoped and attaches encounters to a patient, practitioner, and optionally an appointment. Child records—SOAP notes, care plans, forms, attachment metadata, diagnoses, and procedures—carry the same organization boundary and reference their encounter with composite foreign keys.

## Encounter lifecycle

The supported state machine is `draft → in_progress → completed → amended`. Encounters may be archived from draft, completed, or amended states. Archived encounters are terminal and immutable. Every transition is stored in `encounter_status_history` and the audit log.

## Clinical records

SOAP notes use structured Subjective, Objective, Assessment, and Plan fields. Care plans store goals, interventions, follow-up notes, status, and an optional review date. Forms store type, title, version, completion status, and a structured response placeholder. Diagnoses and procedures are placeholders for future coding workflows. Attachments store metadata and a placeholder storage reference only.

## Privacy, security, and audit

All clinical tables enable RLS. Reads require organization-scoped `clinical.read`; direct inserts, updates, and deletes are denied. Transactional RPCs enforce patient, practitioner, appointment, lifecycle, and permission checks server-side. Audit events cover encounter creation, updates, lifecycle transitions, SOAP, care plans, forms, attachment metadata, diagnoses, and procedures.

## FHIR and future AI

Encounter and child-record boundaries are designed for future FHIR mapping, Canadian provincial interoperability, and e-prescribing integration. These integrations are intentionally absent. AI documentation is also absent; a future system must produce reviewable drafts and must not silently write clinical records.

## Known limitations and rollback

There are no clinical templates, PDF generation, file uploads, external storage, coding integrations, prescriptions, labs, imaging, billing, reminders, patient portal, provincial APIs, or AI documentation. Rollback is a reviewed migration operation in a controlled environment; shared migrations are not edited in place.
