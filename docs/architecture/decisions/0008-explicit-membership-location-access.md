# ADR 0008: Explicit membership location access

- Status: Proposed for Phase 2A
- Date: 2026-07-17

## Context

The existing RLS helpers infer organization-wide access when membership scope rows are absent. That behavior is difficult to audit and ambiguous for future locations.

## Decision

The target model represents organization-wide access and selected location access explicitly. Location grants are subordinate to an organization membership, support expiry where needed, and record grant/revocation actors.

## Consequences

Future-location behavior is visible and testable. A migration must preserve current owners while converting implicit scope semantics.

## Alternatives considered

- Empty scope means all locations: retain only as a compatibility rule, not as the target contract.
- One row per location for every organization-wide member: rejected because it creates excessive writes and obscures intent.
- Application-only grants: rejected because PostgreSQL must enforce the boundary.
