# Clinical Foundation Reconciliation

## Domain interactions

Clinical encounters reference the existing patient and practitioner foundations and may reference an appointment through an organization-aware composite foreign key. When an appointment is supplied, its patient and practitioner must match the encounter and its status must be `in_progress` or `completed`. The encounter remains the canonical clinical context; future clinical modules should reference its ID rather than duplicate appointment data.

## Security and audit

Clinical permissions are separate from appointment permissions. RLS permits reads only through organization membership and `clinical.read`; direct writes are denied. Security-definer RPCs perform all mutations with explicit search paths, lifecycle checks, tenant consistency checks, and append-oriented audit events. Archived encounters are immutable.

## Privacy and interoperability

The foundation stores structured SOAP sections, care-plan content, and placeholders for forms, diagnoses, procedures, and attachment metadata. No file contents, credentials, external identifiers, or patient portal data are introduced. Field names and encounter boundaries leave room for future FHIR mapping and Canadian provincial integration without implementing either.

## Future boundaries and conflicts

- Provincial systems and e-prescribing require reviewed interoperability and consent designs; neither is called by this phase.
- AI documentation must never write clinical content without an explicit future authorization and review workflow.
- Attachments are metadata only; no storage provider is selected.
- Clinical completion is independent of billing, reminders, or claims workflows.
- The initial form response is an object placeholder, not a template engine or PDF workflow.
