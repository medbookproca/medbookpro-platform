# ADR 0010: Store appointment instants in UTC with timezone context

- Status: Proposed for Phase 2A
- Date: 2026-07-17

## Context

Appointments may be viewed by practitioners and patients in different timezones, and Canadian daylight-saving rules require an authoritative timezone context.

## Decision

Store appointment start and end instants as UTC `timestamptz` values and retain the operational IANA timezone used for scheduling. Display converts to location or user timezone according to product policy.

## Consequences

Ordering and conflict detection are stable across regions. Recurring appointments require a future series model that preserves local-time intent.

## Alternatives considered

- Store local timestamps only: rejected because DST and cross-timezone interpretation become ambiguous.
- Store UTC without timezone context: rejected because historical operational display and recurrence rules need the original context.
