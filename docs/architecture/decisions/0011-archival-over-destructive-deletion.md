# ADR 0011: Archive operational records instead of destructive deletion

- Status: Proposed for Phase 2A
- Date: 2026-07-17

## Context

Healthcare, appointment, billing, and audit history may be needed for continuity, privacy operations, investigations, and legal retention.

## Decision

Organizations, locations, memberships, practitioners, patients, services, appointments, subscriptions, and audit events use status transitions, archival, anonymization, retention locks, and legal holds instead of casual hard deletion. Hard deletion is limited to approved non-operational records before activation.

## Consequences

Historical references remain valid and access can be revoked without destroying evidence. Retention schedules and correction/export workflows are required.

## Alternatives considered

- Hard-delete inactive records: rejected because it can destroy healthcare and financial history.
- Soft-delete without RLS changes: rejected because hidden records can remain accessible.
