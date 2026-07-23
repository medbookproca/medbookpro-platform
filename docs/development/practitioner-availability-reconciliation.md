# Practitioner Availability Reconciliation

## Scope

Phase 2D.5 adds availability only. It does not create appointments, booking logic, patient allocation, reminders, waitlists, calendar synchronization, or clinical data.

## Reusable structures

The practitioner foundation already provides organization ownership, practitioner lifecycle, location assignments, service assignments, permissions, RLS helpers, RPC mutation boundaries, and append-only audit events. Availability extends those structures instead of introducing a parallel tenant or identity model.

The availability model is composed of recurring weekly templates and blocks, breaks, date-specific overrides, practitioner time off, organization holidays, and location/service filters. Each row carries `organization_id` and uses composite foreign keys where a related organization-owned record exists.

## Integration boundaries

- Practitioners: only active practitioners may receive active schedules. Draft profiles can be configured but are not selectable by future scheduling.
- Locations: in-person and mixed blocks must reference an active practitioner location assignment. Virtual blocks do not require a location.
- Services: service-specific availability must reference an active practitioner service assignment and may be narrowed to a location.
- Lifecycle: archived practitioners cannot be changed; inactive practitioners retain history but are excluded from preview results.
- Time zones: templates store an IANA time-zone identifier and all recurring calculations use local wall-clock dates/times before future UTC conversion.

## Precedence

Preview evaluates organization holidays and practitioner time off first, then date overrides, recurring blocks, location/service filters, and breaks. An unavailable override suppresses the date. An available override replaces recurring blocks for that date. Breaks subtract from otherwise available intervals. No appointment or capacity allocation is performed.

## Security and audit

All availability tables are organization-scoped with RLS enabled. Direct authenticated writes are denied; security-definer RPCs validate `auth.uid()`, permission, practitioner organization, lifecycle, and related location/service ownership. Mutations emit action-specific audit events without storing secrets or patient information.

## Future hooks

- Scheduling will consume the preview RPC/service and must apply appointment conflicts and capacity separately.
- Calendar adapters may import external busy intervals as temporary overrides, but no provider integration is included here.
- AI scheduling may consume normalized preview intervals and filter by service, location, mode, and time zone; it must not bypass RLS or mutate availability directly.

## Assumptions and conflicts

- A recurring template has one IANA time zone and can contain multiple blocks per day.
- Organization holidays are organization-wide unless narrowed to a location. Practitioner holidays are represented as typed time-off ranges.
- Capacity is a future hint only; no concurrent-capacity enforcement exists.
- DST-safe output is represented as local date/time intervals with the template time zone. UTC slot materialization belongs to the future scheduling engine.
- The previous PRD intentionally deferred scheduling and calendar integrations; this foundation adds only the minimum data and preview boundary needed for those later phases.
