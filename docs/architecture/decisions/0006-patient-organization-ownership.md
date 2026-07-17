# ADR 0006: Patients are owned by organizations

- Status: Proposed for Phase 2A
- Date: 2026-07-17

## Context

Patients may attend multiple locations and see multiple practitioners. Practitioner or location ownership would make continuity, access revocation, and historical reporting unsafe.

## Decision

Patient records belong to exactly one organization in v1. Locations and practitioners provide context and access scope but never own the patient. Future patient portal linkage is optional and does not change organization ownership.

## Consequences

Patient RLS can enforce a direct organization boundary. Duplicate detection, merge history, correction, export, retention, and legal-hold workflows are organization-level concerns.

## Alternatives considered

- Practitioner-owned patients: rejected because it breaks cross-location continuity.
- Location-owned patients: rejected because a patient may attend multiple locations.
- Globally shared patients: rejected because it creates cross-tenant privacy risk.
