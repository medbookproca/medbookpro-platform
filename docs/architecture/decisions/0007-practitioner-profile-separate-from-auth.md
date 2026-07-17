# ADR 0007: Practitioner profile separate from Auth identity

- Status: Proposed for Phase 2A
- Date: 2026-07-17

## Context

Supabase Auth manages credentials and sessions, while practitioner profiles need organization ownership, professional status, multi-location relationships, booking settings, and historical references.

## Decision

Store practitioners as organization-owned professional profiles with an optional one-to-one Auth user link. Do not store professional credentials, authorization roles, or tenant ownership in editable Auth metadata.

## Consequences

Practitioners can work at multiple locations and remain historically referenced after deactivation. Auth lifecycle and professional lifecycle can be reviewed independently.

## Alternatives considered

- Treat every Auth user as a practitioner: rejected because staff, billing users, and future portal users are different personas.
- Store credentials in Auth metadata: rejected because it is not a secure relational professional-record boundary.
