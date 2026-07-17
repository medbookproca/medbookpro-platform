# ADR 0012: Audit sensitive domain actions

- Status: Proposed for Phase 2A
- Date: 2026-07-17

## Context

Healthcare-sensitive systems need evidence of access and change without recording credentials, tokens, or unnecessary clinical content.

## Decision

Audit organization changes, access and role changes, invitations, practitioner associations, patient access, appointment changes, exports, security events, and support access. Events contain actor, tenant, optional location, action, subject, time, request correlation, outcome, source, and redacted metadata.

## Consequences

Investigations and privacy operations have a common append-oriented record. Redaction, retention, legal hold, and restricted audit-read policies are release requirements.

## Alternatives considered

- Application logs only: rejected because logs are not a durable tenant-aware audit boundary.
- Full request/clinical payloads: rejected because they over-collect sensitive data.
