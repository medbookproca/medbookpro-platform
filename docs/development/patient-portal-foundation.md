# Patient Portal Foundation

This phase establishes the internal contract for a Canadian-first patient self-service surface without implementing authentication. The web routes are protected by the existing Supabase session boundary and then require an active `patient_portal_accounts` mapping.

## Capabilities

- Read a patient-only dashboard, appointments, billing summary, communications metadata, profile, preferences, and consents.
- Submit appointment requests as draft appointments, cancel requests, update safe profile fields, save preferences, and accept consent versions.
- Record portal activity in `patient_portal_events` and security-sensitive actions in `audit_events`.

## Limitations and rollback

There is no login/signup flow, invite workflow, credential recovery, external provider, live payment, document storage, or live telehealth. If this phase is rolled back, remove the portal migration and routes together; existing patient, communications, billing, and consent foundations remain independent.

All portal queries must continue to enforce both patient ownership and organization ownership. Future family access must introduce an explicit delegated relationship rather than weakening these checks.
